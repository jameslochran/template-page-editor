const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import services
const PageShareService = require('./src/services/pageShareService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const pageShareService = new PageShareService();

// Make services available to routes
app.locals.pageShareService = pageShareService;

// In-memory data structures for templates and categories
const categories = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Business' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'E-commerce' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Landing Page' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Portfolio' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Blog' },
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Corporate' }
];

const templates = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    name: 'Modern Business Homepage',
    description: 'A clean and professional business homepage template with hero section, services, and contact information.',
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    thumbnail: '/images/templates/business-homepage.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Welcome to Our Business',
          callToAction: {
            buttonText: 'Get Started',
            linkUrl: '#contact'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Business background'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'We provide innovative solutions to help your business grow and succeed in today\'s competitive market.',
          format: 'html'
        }
      },
      {
        type: 'card',
        defaultValues: {
          title: 'Our Services',
          description: {
            format: 'html',
            data: 'We offer a comprehensive range of services designed to meet your business needs.'
          },
          imageUrl: '',
          altText: 'Services illustration'
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    name: 'E-commerce Product Showcase',
    description: 'A responsive e-commerce template featuring product grids, shopping cart, and checkout flow.',
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
    thumbnail: '/images/templates/ecommerce-showcase.jpg',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Shop Our Latest Collection',
          callToAction: {
            buttonText: 'Shop Now',
            linkUrl: '#products'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Product showcase'
        }
      },
      {
        type: 'card',
        defaultValues: {
          title: 'Featured Product',
          description: {
            format: 'html',
            data: 'Discover our most popular items with unbeatable quality and style.'
          },
          imageUrl: '',
          altText: 'Featured product'
        }
      },
      {
        type: 'button',
        defaultValues: {
          text: 'Add to Cart',
          style: 'primary',
          linkUrl: '#cart'
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    name: 'Creative Portfolio Landing',
    description: 'A stunning portfolio template perfect for designers, photographers, and creative professionals.',
    categoryId: '550e8400-e29b-41d4-a716-446655440004',
    thumbnail: '/images/templates/portfolio-landing.jpg',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Creative Portfolio',
          callToAction: {
            buttonText: 'View My Work',
            linkUrl: '#portfolio'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Creative background'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'I am a passionate creative professional specializing in innovative design solutions.',
          format: 'html'
        }
      },
      {
        type: 'image',
        defaultValues: {
          imageUrl: '',
          altText: 'Portfolio showcase',
          width: 400,
          height: 300
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    name: 'Corporate About Page',
    description: 'Professional corporate about page template with team section, company history, and values.',
    categoryId: '550e8400-e29b-41d4-a716-446655440006',
    thumbnail: '/images/templates/corporate-about.jpg',
    createdAt: '2024-01-18T11:45:00Z',
    updatedAt: '2024-01-18T11:45:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'About Our Company',
          callToAction: {
            buttonText: 'Learn More',
            linkUrl: '#history'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Corporate background'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'We are a leading company with over 20 years of experience in delivering exceptional solutions to our clients.',
          format: 'html'
        }
      },
      {
        type: 'accordion',
        defaultValues: {
          title: 'Company Information',
          items: [
            {
              title: 'Our Mission',
              content: 'To provide innovative solutions that drive business success.'
            },
            {
              title: 'Our Values',
              content: 'Integrity, excellence, and customer satisfaction are at the core of everything we do.'
            }
          ]
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440005',
    name: 'Blog Article Layout',
    description: 'Clean and readable blog template with article layout, sidebar, and comment section.',
    categoryId: '550e8400-e29b-41d4-a716-446655440005',
    thumbnail: '/images/templates/blog-article.jpg',
    createdAt: '2024-01-19T16:20:00Z',
    updatedAt: '2024-01-19T16:20:00Z',
    isActive: true,
    components: [
      {
        type: 'text',
        defaultValues: {
          content: '<h1>Blog Article Title</h1><p>This is a sample blog article with clean, readable formatting.</p>',
          format: 'html'
        }
      },
      {
        type: 'image',
        defaultValues: {
          imageUrl: '',
          altText: 'Article featured image',
          width: 600,
          height: 400
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
          format: 'html'
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440006',
    name: 'SaaS Landing Page',
    description: 'High-converting SaaS landing page template with pricing tables, testimonials, and CTA sections.',
    categoryId: '550e8400-e29b-41d4-a716-446655440003',
    thumbnail: '/images/templates/saas-landing.jpg',
    createdAt: '2024-01-20T13:10:00Z',
    updatedAt: '2024-01-20T13:10:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Revolutionary SaaS Solution',
          callToAction: {
            buttonText: 'Start Free Trial',
            linkUrl: '#signup'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'SaaS platform'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'Transform your business with our cutting-edge software solution. Join thousands of satisfied customers.',
          format: 'html'
        }
      },
      {
        type: 'button',
        defaultValues: {
          text: 'Get Started Now',
          style: 'primary',
          linkUrl: '#pricing'
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440007',
    name: 'Restaurant Menu Page',
    description: 'Appetizing restaurant template featuring menu display, location info, and reservation form.',
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    thumbnail: '/images/templates/restaurant-menu.jpg',
    createdAt: '2024-01-21T08:30:00Z',
    updatedAt: '2024-01-21T08:30:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Welcome to Our Restaurant',
          callToAction: {
            buttonText: 'Make Reservation',
            linkUrl: '#reservation'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Restaurant interior'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'Experience fine dining with our carefully crafted menu featuring fresh, locally sourced ingredients.',
          format: 'html'
        }
      },
      {
        type: 'card',
        defaultValues: {
          title: 'Chef\'s Special',
          description: {
            format: 'html',
            data: 'Our signature dish prepared with the finest ingredients and traditional cooking techniques.'
          },
          imageUrl: '',
          altText: 'Chef special dish'
        }
      }
    ]
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440008',
    name: 'Online Store Homepage',
    description: 'Complete online store template with featured products, categories, and promotional banners.',
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
    thumbnail: '/images/templates/online-store.jpg',
    createdAt: '2024-01-22T15:45:00Z',
    updatedAt: '2024-01-22T15:45:00Z',
    isActive: true,
    components: [
      {
        type: 'banner',
        defaultValues: {
          headlineText: 'Welcome to Our Online Store',
          callToAction: {
            buttonText: 'Shop Now',
            linkUrl: '#products'
          },
          backgroundImageUrl: '',
          backgroundImageAltText: 'Online store banner'
        }
      },
      {
        type: 'text',
        defaultValues: {
          content: 'Discover amazing products at unbeatable prices. Free shipping on orders over $50!',
          format: 'html'
        }
      },
      {
        type: 'linkgroup',
        defaultValues: {
          title: 'Quick Links',
          links: [
            {
              text: 'New Arrivals',
              url: '#new-arrivals'
            },
            {
              text: 'Best Sellers',
              url: '#best-sellers'
            },
            {
              text: 'Sale Items',
              url: '#sale'
            }
          ]
        }
      }
    ]
  }
];

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.quilljs.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://cdn.quilljs.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes for template management
app.get('/api/templates', (req, res) => {
  try {
    const { categoryId, keyword, sortBy = 'name' } = req.query;
    
    // Validate sortBy parameter
    const validSortFields = ['name', 'description', 'createdAt', 'updatedAt'];
    if (sortBy && !validSortFields.includes(sortBy)) {
      return res.status(400).json({ 
        error: 'Invalid sortBy parameter', 
        validFields: validSortFields 
      });
    }
    
    // Validate categoryId format if provided
    if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
      return res.status(400).json({ 
        error: 'Invalid categoryId format. Must be a valid UUID.' 
      });
    }
    
    let filteredTemplates = [...templates];
    
    // Filter by categoryId if provided
    if (categoryId) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.categoryId === categoryId
      );
    }
    
    // Search by keyword if provided
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort templates
    filteredTemplates.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
    
    res.json(filteredTemplates);
    
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/templates/:id - Get a specific template by ID
app.get('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates', (req, res) => {
  // Placeholder for creating templates
  res.json({ message: 'Template created successfully' });
});

app.put('/api/templates/:id', (req, res) => {
  // Placeholder for updating templates
  res.json({ message: 'Template updated successfully' });
});

app.delete('/api/templates/:id', (req, res) => {
  // Placeholder for deleting templates
  res.json({ message: 'Template deleted successfully' });
});

// API route for getting categories
app.get('/api/categories', (req, res) => {
  try {
    // Return categories sorted alphabetically by name
    const sortedCategories = [...categories].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    res.json(sortedCategories);
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import and register page API routes
const pageRoutes = require('./src/api/pages');
const pageVersionRoutes = require('./src/api/pageVersions');
const pageShareRoutes = require('./src/api/pageShares');
app.use('/api/pages', pageRoutes);
app.use('/api/pages', pageVersionRoutes);
app.use('/api/pages', pageShareRoutes);

// Import and register admin template upload routes
const adminTemplateUploadRoutes = require('./src/api/adminTemplateUpload');
app.use('/api/admin/templates/upload', adminTemplateUploadRoutes);

// Import and register admin template CRUD routes
const adminTemplateCrudRoutes = require('./src/api/adminTemplates');
const adminCategoryRoutes = require('./src/api/adminCategoryRoutes');
const imageUploadRoutes = require('./src/api/imageUpload');
app.use('/api/admin/templates', adminTemplateCrudRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/images', imageUploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Template Page Editor server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
