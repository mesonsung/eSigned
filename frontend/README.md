# eSigned Frontend

A responsive Vue.js web application for digital document signing that integrates with the backend API.

## Features

- **User Authentication**: Login and registration with JWT tokens
- **PDF Upload**: Drag-and-drop PDF file upload with validation
- **PDF Viewer**: Multi-page PDF rendering with zoom controls
- **Digital Signature**: Mouse/touch signature capture
- **Document Management**: View, download, and manage signed documents
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful glass-morphism design with smooth animations

## Technology Stack

- **Vue.js 2.7.16** - Progressive JavaScript framework
- **Vuetify 2.7.0** - Material Design component framework
- **Vuex 3.6.2** - State management
- **Vue Router 3.6.5** - Client-side routing
- **Axios 0.21.1** - HTTP client
- **PDF.js 4.7.336** - PDF rendering
- **Vue Signature Pad 2.0.0** - Digital signature capture

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── PdfViewer.vue   # PDF rendering component
│   └── SignaturePad.vue # Digital signature component
├── views/              # Page components
│   ├── Login.vue       # Login page
│   ├── Register.vue    # Registration page
│   ├── Dashboard.vue   # Main dashboard
│   ├── SignDocument.vue # Document signing workflow
│   └── MyDocuments.vue # Document management
├── store/              # Vuex store
│   └── index.js        # State management
├── router/             # Vue Router
│   └── index.js        # Route configuration
├── config/             # Configuration files
│   └── axios.js        # Axios configuration
├── plugins/            # Vue plugins
│   └── vuetify.js      # Vuetify configuration
├── App.vue             # Root component
└── main.js             # Application entry point
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env file
echo "VUE_APP_API_URL=http://localhost:5000" > .env
```

3. Start development server:
```bash
npm run serve
```

The application will be available at `http://localhost:8080`

## Usage

### Authentication
- Register a new account or login with existing credentials
- JWT tokens are automatically managed and stored

### Document Signing Workflow
1. Navigate to "Sign Document"
2. Upload a PDF file (drag-and-drop or click to browse)
3. Review the document in the PDF viewer
4. Draw your signature in the signature pad
5. Click "Sign Document" to complete the process
6. Download the signed document

### Document Management
- View all your documents in "Signed Documents"
- Download signed documents
- Track document status (pending/signed)

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/documents` - Get user documents
- `POST /api/documents/upload` - Upload PDF documents
- `POST /api/documents/sign` - Sign documents
- `GET /api/documents/download/:id` - Download documents

## Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Development

### Available Scripts

- `npm run serve` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint with Standard configuration for consistent code style.

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist/` directory

3. Serve the `dist/` directory with a web server like Nginx or Apache

## Security Considerations

- JWT tokens are stored in localStorage
- File uploads are validated for type and size
- HTTPS should be used in production
- CORS is configured for the backend API

## Troubleshooting

### Common Issues

1. **PDF not loading**: Ensure the PDF file is valid and not corrupted
2. **Signature not saving**: Check that the signature pad has content
3. **Upload failing**: Verify file size is under 10MB and file is PDF
4. **Authentication errors**: Check if backend is running and accessible

### Debug Mode

Enable debug logging by opening browser developer tools and checking the console for detailed error messages.
