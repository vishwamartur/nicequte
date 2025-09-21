# InvGen - Professional Quotation Generator

A comprehensive web application for generating professional quotations and estimates for plumbing and electrical work with automatic GST calculations.

## Features

### 🧾 **Core Functionality**
- Generate professional quotations/estimates for plumbing and electrical work
- Automatic GST calculation with configurable tax rates (default 18%)
- Comprehensive product catalog with categories for plumbing and electrical materials
- Professional PDF generation and printing capabilities

### 📦 **Product Management**
- **Plumbing Materials**: Pipes, fittings, fixtures, valves, taps, toilet seats, etc.
- **Electrical Materials**: Wires, switches, outlets, breakers, conduits, LED bulbs, etc.
- Product search and filtering by category
- Detailed product specifications and pricing
- SKU-based inventory tracking

### 💰 **Advanced Calculations**
- Real-time quantity and pricing calculations
- Automatic GST breakdown (CGST/SGST or IGST)
- Line-item totals with subtotal and final amount
- Configurable tax rates per quotation
- Professional tax breakdown display

### 📄 **Professional Output**
- Clean, professional quotation layout
- Company branding and customer information
- Itemized product listing with specifications
- Tax breakdown and total calculations
- PDF export and print functionality
- 30-day validity period (configurable)

### 🗄️ **Data Management**
- MongoDB Atlas cloud database with Prisma ORM
- Customer information management
- Quotation history and status tracking
- Product catalog management
- Company settings and configuration

### 🔧 **Advanced Features**
- **Search & Filtering**: Advanced search across quotations, products, and customers
- **Bulk Operations**: Multi-select functionality for batch operations
- **Status Management**: Quotation workflow (Draft, Sent, Accepted, Rejected, Expired)
- **Print Optimization**: CSS print styles for professional output
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB Atlas with Prisma ORM
- **PDF Generation**: jsPDF with html2canvas
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vishwamartur/nicequte.git
   cd nicequte
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mongodb+srv://root:password@vishwa.hgb4t.mongodb.net/invgen?retryWrites=true&w=majority&appName=vishwa"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to MongoDB
   npx prisma db push
   ```

5. **Seed the database with sample data**
   ```bash
   npx tsx prisma/seed-mongodb.ts
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. **Initialize Sample Data**
- Sample data is automatically seeded during installation
- Includes plumbing and electrical materials with realistic pricing
- Contains 1 company, 2 categories, 10 products, 1 customer, and 1 sample quotation

### 2. **Browse Products**
- Navigate to "Products" to view the catalog
- Filter by category (Plumbing/Electrical)
- Search by product name, description, or SKU
- View detailed specifications and pricing

### 3. **Create Quotations**
- Click "New Quotation" from dashboard or navigation
- Fill in customer information (name is required)
- Add products by searching and selecting from catalog
- Adjust quantities as needed
- Configure GST rate (default 18%)
- Add title, description, and notes
- Save the quotation

### 4. **Manage Quotations**
- View all quotations in the "Quotations" section
- Filter by status (Draft, Sent, Accepted, etc.)
- Search by quotation number or customer name
- Export to PDF or print quotations

## Database Schema

### Key Models
- **Company**: Business information and GST settings
- **Category**: Product categories (Plumbing/Electrical)
- **Product**: Product catalog with pricing and specifications
- **Customer**: Customer information and GST details
- **Quotation**: Main quotation with totals and metadata
- **QuotationItem**: Individual line items in quotations

## API Endpoints

### Products
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product
- `GET /api/categories` - List product categories

### Quotations
- `GET /api/quotations` - List quotations with filtering
- `POST /api/quotations` - Create new quotation
- `GET /api/quotations/[id]` - Get specific quotation
- `PUT /api/quotations/[id]` - Update quotation
- `DELETE /api/quotations/[id]` - Delete quotation

### Utilities
- `POST /api/seed` - Seed database with sample data

## Configuration

### GST Settings
- Default GST rate: 18% (configurable per quotation)
- Automatic CGST/SGST breakdown for intra-state transactions
- IGST calculation for inter-state transactions
- GST number validation and display

### Company Information
Update company details in the database or through the seeding process:
- Company name and address
- Contact information
- GST registration number
- Logo (future enhancement)

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── generated/           # Prisma generated client
└── prisma/             # Database schema and migrations
```

### Key Components
- `Layout`: Main application layout with navigation
- `QuotationPreview`: Professional quotation display
- `ProductCatalog`: Product browsing and selection
- `QuotationForm`: Quotation creation interface

### Database Operations
- Prisma ORM for type-safe database operations
- Automatic migrations and schema management
- Seeding utilities for sample data

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all environment variables are set in production:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production"

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**InvGen** - Professional quotation generation made simple and efficient.
