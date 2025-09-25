import { prisma } from './prisma'
import { seedDatabase } from './seed'

export interface DatabaseInitConfig {
  enableAutoSeed: boolean
  environment: string
  skipSeedingInProduction: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxRetries: number
  retryDelay: number
}

export interface DatabaseInitResult {
  success: boolean
  message: string
  details?: {
    connectionStatus: boolean
    schemaStatus: boolean
    seedingStatus: boolean
    seedingSkipped?: boolean
    error?: unknown
  }
}

class DatabaseInitializer {
  private config: DatabaseInitConfig
  private logger: (level: string, message: string, data?: unknown) => void

  constructor(config?: Partial<DatabaseInitConfig>) {
    this.config = {
      enableAutoSeed: process.env.ENABLE_AUTO_SEED !== 'false',
      environment: process.env.NODE_ENV || 'development',
      skipSeedingInProduction: process.env.SKIP_SEEDING_IN_PRODUCTION === 'true',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      maxRetries: parseInt(process.env.DB_INIT_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.DB_INIT_RETRY_DELAY || '2000'),
      ...config
    }

    this.logger = this.createLogger()
  }

  private createLogger() {
    return (level: string, message: string, data?: unknown) => {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 }
      const currentLevel = levels[this.config.logLevel as keyof typeof levels] || 1
      const messageLevel = levels[level as keyof typeof levels] || 1

      if (messageLevel >= currentLevel) {
        const timestamp = new Date().toISOString()
        const logMessage = `[${timestamp}] [DB-INIT] [${level.toUpperCase()}] ${message}`
        
        if (data) {
          console.log(logMessage, data)
        } else {
          console.log(logMessage)
        }
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      this.logger('debug', 'Testing database connection...')
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      this.logger('info', 'Database connection successful')
      return true
    } catch (error) {
      this.logger('error', 'Database connection failed', error)
      return false
    }
  }

  private async ensureSchemaExists(): Promise<boolean> {
    try {
      this.logger('debug', 'Checking database schema...')
      
      // Test if we can query basic collections/tables
      await prisma.company.findFirst()
      
      this.logger('info', 'Database schema is ready')
      return true
    } catch (error) {
      this.logger('warn', 'Schema check failed, may need migration', error)
      return false
    }
  }

  private async checkIfDatabaseIsEmpty(): Promise<boolean> {
    try {
      const [companyCount, categoryCount, productCount] = await Promise.all([
        prisma.company.count(),
        prisma.category.count(),
        prisma.product.count()
      ])

      const isEmpty = companyCount === 0 && categoryCount === 0 && productCount === 0
      this.logger('debug', `Database empty check: ${isEmpty}`, {
        companies: companyCount,
        categories: categoryCount,
        products: productCount
      })

      return isEmpty
    } catch (error) {
      this.logger('error', 'Failed to check if database is empty', error)
      return false
    }
  }

  private shouldSkipSeeding(): boolean {
    if (!this.config.enableAutoSeed) {
      this.logger('info', 'Auto-seeding is disabled via configuration')
      return true
    }

    if (this.config.environment === 'production' && this.config.skipSeedingInProduction) {
      this.logger('info', 'Skipping seeding in production environment')
      return true
    }

    return false
  }

  private async performSeeding(): Promise<{ success: boolean; error?: unknown }> {
    try {
      this.logger('info', 'Starting database seeding...')
      const result = await seedDatabase()
      
      if (result.success) {
        this.logger('info', 'Database seeding completed successfully')
        return { success: true }
      } else {
        this.logger('error', 'Database seeding failed', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      this.logger('error', 'Database seeding threw an exception', error)
      return { success: false, error }
    }
  }

  async initialize(): Promise<DatabaseInitResult> {
    const startTime = Date.now()
    this.logger('info', `Starting database initialization in ${this.config.environment} environment`)

    let attempt = 0
    let connectionSuccess = false
    let schemaReady = false
    let seedingResult = { success: false, error: undefined as unknown }
    let seedingSkipped = false

    // Retry connection with exponential backoff
    while (attempt < this.config.maxRetries && !connectionSuccess) {
      attempt++
      this.logger('debug', `Connection attempt ${attempt}/${this.config.maxRetries}`)
      
      connectionSuccess = await this.testDatabaseConnection()
      
      if (!connectionSuccess && attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
        this.logger('warn', `Connection failed, retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    if (!connectionSuccess) {
      const errorMessage = `Failed to connect to database after ${this.config.maxRetries} attempts`
      this.logger('error', errorMessage)
      return {
        success: false,
        message: errorMessage,
        details: {
          connectionStatus: false,
          schemaStatus: false,
          seedingStatus: false,
          error: 'Database connection failed'
        }
      }
    }

    // Check schema
    schemaReady = await this.ensureSchemaExists()
    if (!schemaReady) {
      const errorMessage = 'Database schema is not ready. Please run migrations first.'
      this.logger('error', errorMessage)
      return {
        success: false,
        message: errorMessage,
        details: {
          connectionStatus: true,
          schemaStatus: false,
          seedingStatus: false,
          error: 'Schema not ready'
        }
      }
    }

    // Handle seeding
    if (this.shouldSkipSeeding()) {
      seedingSkipped = true
      this.logger('info', 'Database seeding skipped')
    } else {
      const isEmpty = await this.checkIfDatabaseIsEmpty()
      
      if (isEmpty) {
        this.logger('info', 'Database is empty, proceeding with seeding')
        seedingResult = await this.performSeeding()
      } else {
        this.logger('info', 'Database already contains data, skipping seeding')
        seedingResult = { success: true, error: undefined }
        seedingSkipped = true
      }
    }

    const duration = Date.now() - startTime
    const success = connectionSuccess && schemaReady && (seedingResult.success || seedingSkipped)
    
    this.logger('info', `Database initialization completed in ${duration}ms`, {
      success,
      connection: connectionSuccess,
      schema: schemaReady,
      seeding: seedingResult.success,
      seedingSkipped
    })

    return {
      success,
      message: success 
        ? 'Database initialization completed successfully'
        : 'Database initialization failed',
      details: {
        connectionStatus: connectionSuccess,
        schemaStatus: schemaReady,
        seedingStatus: seedingResult.success,
        seedingSkipped,
        error: seedingResult.error
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await prisma.$disconnect()
      this.logger('debug', 'Database connection closed')
    } catch (error) {
      this.logger('warn', 'Error closing database connection', error)
    }
  }
}

// Singleton instance
let dbInitializer: DatabaseInitializer | null = null

export function getDatabaseInitializer(config?: Partial<DatabaseInitConfig>): DatabaseInitializer {
  if (!dbInitializer) {
    dbInitializer = new DatabaseInitializer(config)
  }
  return dbInitializer
}

export async function initializeDatabase(config?: Partial<DatabaseInitConfig>): Promise<DatabaseInitResult> {
  const initializer = getDatabaseInitializer(config)
  return await initializer.initialize()
}
