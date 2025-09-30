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
    const { categoryId, category, keyword, search, sortBy = 'name' } = req.query;
    
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
    
    // Filter by categoryId or category if provided
    const filterCategoryId = categoryId || category;
    if (filterCategoryId) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.categoryId === filterCategoryId
      );
    }
    
    // Search by keyword or search if provided
    const searchTerm = keyword || search;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
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
  try {
    const { name, description, categoryId, components } = req.body;
    
    // Validate required fields
    if (!name || !description || !categoryId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, categoryId' 
      });
    }
    
    // Validate categoryId exists
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(400).json({ 
        error: 'Invalid categoryId. Category not found.' 
      });
    }
    
    // Create new template
    const newTemplate = {
      id: `650e8400-e29b-41d4-a716-446655440${Date.now().toString().slice(-3)}`,
      name,
      description,
      categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      components: components || []
    };
    
    templates.push(newTemplate);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, components } = req.body;
    
    // Find template
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Validate categoryId if provided
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (!category) {
        return res.status(400).json({ 
          error: 'Invalid categoryId. Category not found.' 
        });
      }
    }
    
    // Update template
    const updatedTemplate = {
      ...templates[templateIndex],
      ...(name && { name }),
      ...(description && { description }),
      ...(categoryId && { categoryId }),
      ...(components && { components }),
      updatedAt: new Date().toISOString()
    };
    
    templates[templateIndex] = updatedTemplate;
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Find template
    const templateIndex = templates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Remove template
    const deletedTemplate = templates.splice(templateIndex, 1)[0];
    
    res.json({ 
      message: 'Template deleted successfully',
      deletedTemplate 
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
app.use('/api', pageShareRoutes);

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

// Mock upload endpoint for development/testing
app.put('/api/mock-upload/:uploadId', (req, res) => {
    const { uploadId } = req.params;
    console.log(`Mock upload endpoint called for upload ID: ${uploadId}`);
    
    // Simulate successful upload
    res.status(200).json({
        success: true,
        message: 'Mock upload successful',
        uploadId: uploadId,
        timestamp: new Date().toISOString()
    });
});

// Mock file serving endpoint for development
app.get('/api/mock-files/:uploadId', (req, res) => {
    const { uploadId } = req.params;
    
    // For development, serve a placeholder image
    // In a real implementation, this would serve the actual uploaded file
    const placeholderSvg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
            <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
                Uploaded Template
            </text>
            <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
                Upload ID: ${uploadId}
            </text>
            <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
                (Mock Development Image)
            </text>
        </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(placeholderSvg);
});

// User search API endpoint for sharing functionality
app.get('/api/users/search', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.json({
            success: true,
            data: [],
            message: 'Search query must be at least 2 characters'
        });
    }
    
    // Mock user data for search
    const mockUsers = [
        {
            id: '550e8400-e29b-41d4-a716-446655440010',
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatar: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440011',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            avatar: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440012',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            avatar: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440013',
            name: 'Alice Brown',
            email: 'alice.brown@example.com',
            avatar: null
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440014',
            name: 'Charlie Wilson',
            email: 'charlie.wilson@example.com',
            avatar: null
        }
    ];
    
    // Filter users based on search query
    const searchTerm = q.toLowerCase().trim();
    const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    
    res.json({
        success: true,
        data: filteredUsers,
        query: q,
        count: filteredUsers.length
    });
});

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
