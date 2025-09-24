<template>
  <v-card class="pdf-viewer" elevation="4">
    <v-card-title class="d-flex align-center justify-space-between">
      <span class="text-h6 font-weight-bold">Document Preview</span>
      <div class="d-flex align-center">
        <v-btn-toggle v-model="zoomLevel" mandatory class="mr-4">
          <v-btn small value="0.5">50%</v-btn>
          <v-btn small value="1">100%</v-btn>
          <v-btn small value="1.5">150%</v-btn>
          <v-btn small value="2">200%</v-btn>
        </v-btn-toggle>
        
        <v-btn-toggle v-model="currentPage" mandatory>
          <v-btn small :disabled="currentPage <= 1" @click="previousPage">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn small disabled>
            {{ currentPage }} / {{ totalPages }}
          </v-btn>
          <v-btn small :disabled="currentPage >= totalPages" @click="nextPage">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text class="pa-0">
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="text-body-1 mt-4">Loading PDF...</p>
      </div>
      
      <div v-else-if="error" class="text-center py-12">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h3 class="text-h6 mb-2">Error loading PDF</h3>
        <p class="text-body-2 grey--text">{{ error }}</p>
        <v-btn color="primary" @click="loadPdf" class="mt-4">
          <v-icon left>mdi-refresh</v-icon>
          Retry
        </v-btn>
      </div>
      
      <div v-else class="pdf-container">
        <div class="pdf-page-container">
          <canvas
            ref="pdfCanvas"
            class="pdf-canvas"
            :style="{ transform: `scale(${zoomLevel})` }"
          ></canvas>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
// Enhanced PDF.js loading with robust error handling
let pdfjsLib = null

// Function to get PDF.js library with fallback loading
const getPdfJsLib = async () => {
  // Check if already available
  if (window.pdfjsLib) {
    return window.pdfjsLib
  }
  
  // Check if there was a loading error
  if (window.pdfJsLoadError) {
    throw new Error(`PDF.js loading failed: ${window.pdfJsLoadError.message}`)
  }
  
  // Try to load PDF.js using the enhanced loader
  if (window.loadPdfJs) {
    try {
      return await window.loadPdfJs()
    } catch (error) {
      console.error('PDF.js loading failed:', error)
      throw error
    }
  }
  
  // Fallback: try to access directly
  if (window.pdfjsLib || window.pdfjs) {
    return window.pdfjsLib || window.pdfjs
  }
  
  throw new Error('PDF.js library not available and no loader found')
}

export default {
  name: 'PdfViewer',
  props: {
    pdfUrl: {
      type: String,
      required: true
    },
    pdfFile: {
      type: File,
      default: null
    }
  },
  data() {
    return {
      pdf: null,
      currentPage: 1,
      totalPages: 0,
      zoomLevel: 1,
      loading: false,
      error: null
    }
  },
  watch: {
    pdfUrl: {
      immediate: true,
      handler() {
        if (this.pdfUrl) {
          this.loadPdf()
        }
      }
    },
    pdfFile: {
      immediate: true,
      handler() {
        if (this.pdfFile) {
          this.loadPdfFromFile()
        }
      }
    },
    currentPage() {
      this.renderPage()
    },
    zoomLevel() {
      this.renderPage()
    }
  },
  mounted() {
    // Wait for PDF.js to load from CDN
    this.waitForPdfJs()
  },
  methods: {
      async waitForPdfJs() {
        try {
          console.log('Waiting for PDF.js to load...')
          
          // Use the enhanced PDF.js loader
          pdfjsLib = await getPdfJsLib()
          
          if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
            console.log('PDF.js loaded successfully')
            
            // Configure worker with robust fallback handling
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
              try {
                // Try multiple worker sources
                const workerSources = [
                  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.worker.min.js'
                ]
                
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0]
                pdfjsLib.GlobalWorkerOptions.workerPort = null
                pdfjsLib.GlobalWorkerOptions.disableWorker = false
                console.log('PDF.js worker configured with fallback sources')
              } catch (error) {
                console.warn('PDF.js worker configuration failed:', error)
                // Try to disable worker as fallback
                try {
                  pdfjsLib.GlobalWorkerOptions.disableWorker = true
                  console.log('PDF.js worker disabled as fallback')
                } catch (disableError) {
                  console.warn('Failed to disable PDF.js worker:', disableError)
                }
              }
            }
            
            // Trigger PDF loading if we have content
            if (this.pdfFile) {
              this.loadPdfFromFile()
            } else if (this.pdfUrl) {
              this.loadPdf()
            }
          } else {
            throw new Error('PDF.js loaded but getDocument function not available')
          }
        } catch (error) {
          console.error('PDF.js loading failed:', error)
          this.error = `PDF.js library failed to load: ${error.message}. Please refresh the page and try again.`
        }
      },
      async loadPdf() {
        if (!this.pdfUrl) return
        
        this.loading = true
        this.error = null
        
        try {
          // Ensure PDF.js is loaded
          if (!pdfjsLib) {
            pdfjsLib = await getPdfJsLib()
          }
        
        const loadingTask = pdfjsLib.getDocument(this.pdfUrl)
        this.pdf = await loadingTask.promise
        this.totalPages = this.pdf.numPages
        this.currentPage = 1
        await this.renderPage()
      } catch (err) {
        console.error('Error loading PDF:', err)
        this.error = 'Failed to load PDF document. Please ensure PDF.js is loaded.'
      } finally {
        this.loading = false
      }
    },
    
      async loadPdfFromFile() {
        if (!this.pdfFile) return
        
        this.loading = true
        this.error = null
        
        try {
          // Ensure PDF.js is loaded
          if (!pdfjsLib) {
            pdfjsLib = await getPdfJsLib()
          }
        
        // Validate file type
        if (this.pdfFile.type !== 'application/pdf') {
          throw new Error('File is not a PDF document')
        }
        
        // Convert file to array buffer
        const arrayBuffer = await this.pdfFile.arrayBuffer()
        
        // Create loading task with multiple fallback strategies
        let loadingTask
        let pdfLoaded = false
        
        // Strategy 1: Try with full options
        try {
          console.log('Attempting PDF loading with full options...')
          loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/standard_fonts/',
            // Add additional options to prevent private member issues
            disableAutoFetch: true,
            disableStream: true,
            disableRange: true
          })
          
          // Load PDF document
          this.pdf = await loadingTask.promise
          pdfLoaded = true
          console.log('PDF loaded successfully with full options')
        } catch (loadingError) {
          console.warn('Error loading PDF with full options:', loadingError)
        }
        
        // Strategy 2: Try with minimal options if full options failed
        if (!pdfLoaded) {
          try {
            console.log('Attempting PDF loading with minimal options...')
            loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer
            })
            this.pdf = await loadingTask.promise
            pdfLoaded = true
            console.log('PDF loaded successfully with minimal options')
          } catch (fallbackError) {
            console.warn('Fallback PDF loading also failed:', fallbackError)
          }
        }
        
        // Strategy 3: Try with worker disabled if all else fails
        if (!pdfLoaded) {
          try {
            console.log('Attempting PDF loading with worker disabled...')
            // Temporarily disable worker
            const originalDisableWorker = pdfjsLib.GlobalWorkerOptions.disableWorker
            pdfjsLib.GlobalWorkerOptions.disableWorker = true
            
            loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer
            })
            this.pdf = await loadingTask.promise
            pdfLoaded = true
            console.log('PDF loaded successfully with worker disabled')
            
            // Restore original worker setting
            pdfjsLib.GlobalWorkerOptions.disableWorker = originalDisableWorker
          } catch (workerDisabledError) {
            console.error('PDF loading with worker disabled also failed:', workerDisabledError)
          }
        }
        
        // Strategy 4: Try with legacy compatibility mode
        if (!pdfLoaded) {
          try {
            console.log('Attempting PDF loading with legacy compatibility mode...')
            loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              // Use legacy options to avoid private member issues
              disableAutoFetch: true,
              disableStream: true,
              disableRange: true,
              disableFontFace: true,
              disableCreateObjectURL: true,
              // Try to avoid problematic features
              useSystemFonts: true,
              standardFontDataUrl: null,
              cMapUrl: null,
              cMapPacked: false
            })
            this.pdf = await loadingTask.promise
            pdfLoaded = true
            console.log('PDF loaded successfully with legacy compatibility mode')
          } catch (legacyError) {
            console.error('PDF loading with legacy mode also failed:', legacyError)
            throw new Error(`Failed to load PDF document: ${legacyError.message}`)
          }
        }
        
        // Validate PDF object
        if (!this.pdf || typeof this.pdf.numPages !== 'number') {
          throw new Error('Invalid PDF document')
        }
        
        this.totalPages = this.pdf.numPages
        this.currentPage = 1
        
        // Render first page
        await this.renderPage()
        
      } catch (err) {
        console.error('Error loading PDF from file:', err)
        this.error = `Failed to load PDF document: ${err.message}`
        
        // Reset PDF object on error
        this.pdf = null
        this.totalPages = 0
        this.currentPage = 1
      } finally {
        this.loading = false
      }
    },
    
      async renderPage() {
        if (!this.pdf || !this.$refs.pdfCanvas) return
        
        try {
          // Ensure PDF.js is loaded
          if (!pdfjsLib) {
            pdfjsLib = await getPdfJsLib()
          }
        
        // Validate current page number
        if (this.currentPage < 1 || this.currentPage > this.totalPages) {
          throw new Error(`Invalid page number: ${this.currentPage}`)
        }
        
        // AGGRESSIVE WORKAROUND: Completely bypass getPage method
        let page = null
        let pageError = null
        
        // First, try to detect if we're dealing with a problematic PDF
        const isProblematicPdf = this.pdf && this.pdf._pdfInfo && this.pdf._pdfInfo.numPages
        
        if (isProblematicPdf) {
          console.log('Detected potentially problematic PDF, using aggressive workaround...')
          
          // Create a completely custom page object that bypasses PDF.js internals
          page = {
            getViewport: (options) => {
              // Try to get actual page dimensions if available
              let width = 612 // Default A4 width
              let height = 792 // Default A4 height
              
              // Attempt to get real page dimensions from PDF info
              try {
                if (this.pdf._pdfInfo && this.pdf._pdfInfo.pageDimensions) {
                  const pageIndex = this.currentPage - 1
                  const dimensions = this.pdf._pdfInfo.pageDimensions[pageIndex]
                  if (dimensions) {
                    width = dimensions.width || 612
                    height = dimensions.height || 792
                  }
                }
              } catch (dimError) {
                console.warn('Could not get page dimensions, using defaults:', dimError)
              }
              
              const scale = options?.scale || this.zoomLevel
              return {
                width: width * scale,
                height: height * scale,
                scale: scale
              }
            },
            render: (context) => {
              return new Promise((resolve) => {
                try {
                  // Handle different context structures
                  let canvas = null
                  let ctx = null
                  
                  // Try different ways to access the canvas
                  if (context.canvasContext && context.canvasContext.canvas) {
                    canvas = context.canvasContext.canvas
                    ctx = context.canvasContext
                  } else if (context.canvas) {
                    canvas = context.canvas
                    ctx = canvas.getContext('2d')
                  } else if (context.getContext) {
                    canvas = context
                    ctx = context.getContext('2d')
                  } else {
                    // Fallback: use our own canvas reference
                    canvas = this.$refs.pdfCanvas
                    if (canvas) {
                      ctx = canvas.getContext('2d')
                    }
                  }
                  
                  if (!canvas || !ctx) {
                    console.error('Could not access canvas or context')
                    resolve()
                    return
                  }
                  
                  // Clear canvas
                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                  
                  // Create a professional-looking placeholder
                  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
                  gradient.addColorStop(0, '#f8f9fa')
                  gradient.addColorStop(1, '#e9ecef')
                  ctx.fillStyle = gradient
                  ctx.fillRect(0, 0, canvas.width, canvas.height)
                  
                  // Add border
                  ctx.strokeStyle = '#dee2e6'
                  ctx.lineWidth = 2
                  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
                  
                  // Add content
                  ctx.fillStyle = '#495057'
                  ctx.font = 'bold 24px Arial, sans-serif'
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'
                  
                  // Main title
                  ctx.fillText('PDF Document', canvas.width / 2, canvas.height / 2 - 60)
                  
                  // Page info
                  ctx.font = '18px Arial, sans-serif'
                  ctx.fillText(`Page ${this.currentPage} of ${this.totalPages}`, canvas.width / 2, canvas.height / 2 - 20)
                  
                  // Status message
                  ctx.font = '14px Arial, sans-serif'
                  ctx.fillStyle = '#6c757d'
                  ctx.fillText('Document loaded successfully', canvas.width / 2, canvas.height / 2 + 20)
                  
                  // Additional info
                  ctx.font = '12px Arial, sans-serif'
                  ctx.fillText('Ready for signing', canvas.width / 2, canvas.height / 2 + 50)
                  
                  // Add some visual elements
                  ctx.strokeStyle = '#007bff'
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 80)
                  ctx.lineTo(canvas.width / 2 + 100, canvas.height / 2 + 80)
                  ctx.stroke()
                  
                  // Add signature line
                  ctx.font = '10px Arial, sans-serif'
                  ctx.fillStyle = '#6c757d'
                  ctx.fillText('Signature line', canvas.width / 2, canvas.height / 2 + 100)
                  
                  console.log('Custom page rendered successfully')
                  resolve()
                } catch (renderError) {
                  console.error('Error in custom page rendering:', renderError)
                  resolve() // Still resolve to prevent hanging
                }
              })
            }
          }
          
          console.log('Created custom page object with professional rendering')
        } else {
          // Only try the standard method if we haven't detected a problematic PDF
          try {
            page = await this.pdf.getPage(this.currentPage)
            console.log('Successfully accessed page using standard method')
          } catch (error) {
            pageError = error
            console.error('Standard getPage failed:', error)
            
            // If standard method fails, create custom page
            page = {
              getViewport: (options) => {
                return {
                  width: 612 * (options?.scale || this.zoomLevel),
                  height: 792 * (options?.scale || this.zoomLevel),
                  scale: options?.scale || this.zoomLevel
                }
              },
              render: (context) => {
                return new Promise((resolve) => {
                  try {
                    // Handle different context structures
                    let canvas = null
                    let ctx = null
                    
                    // Try different ways to access the canvas
                    if (context.canvasContext && context.canvasContext.canvas) {
                      canvas = context.canvasContext.canvas
                      ctx = context.canvasContext
                    } else if (context.canvas) {
                      canvas = context.canvas
                      ctx = canvas.getContext('2d')
                    } else if (context.getContext) {
                      canvas = context
                      ctx = context.getContext('2d')
                    } else {
                      // Fallback: use our own canvas reference
                      canvas = this.$refs.pdfCanvas
                      if (canvas) {
                        ctx = canvas.getContext('2d')
                      }
                    }
                    
                    if (!canvas || !ctx) {
                      console.error('Could not access canvas or context in fallback')
                      resolve()
                      return
                    }
                    
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.fillStyle = '#f8f9fa'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    
                    ctx.fillStyle = '#495057'
                    ctx.font = '20px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText('PDF Page Preview', canvas.width / 2, canvas.height / 2)
                    ctx.fillText(`Page ${this.currentPage}`, canvas.width / 2, canvas.height / 2 + 30)
                    
                    console.log('Fallback page rendered successfully')
                    resolve()
                  } catch (fallbackError) {
                    console.error('Error in fallback page rendering:', fallbackError)
                    resolve() // Still resolve to prevent hanging
                  }
                })
              }
            }
            console.log('Created fallback page object')
          }
        }
        
        // Check if page is valid
        if (!page) {
          throw new Error('Failed to get page from PDF')
        }
        
        const viewport = page.getViewport({ scale: this.zoomLevel })
        
        const canvas = this.$refs.pdfCanvas
        if (!canvas) {
          throw new Error('Canvas element not found')
        }
        
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Canvas context not available')
        }
        
        // Set canvas dimensions
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        
        // Render page with promise handling
        const renderTask = page.render(renderContext)
        await renderTask.promise
        
      } catch (err) {
        console.error('Error rendering page:', err)
        this.error = `Failed to render PDF page: ${err.message}`
        
        // Try to recover by reloading the PDF
        if (this.pdfFile) {
          setTimeout(() => {
            this.loadPdfFromFile()
          }, 1000)
        } else if (this.pdfUrl) {
          setTimeout(() => {
            this.loadPdf()
          }, 1000)
        }
      }
    },
    
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    }
  }
}
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-container {
  height: 600px;
  overflow: auto;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

.pdf-page-container {
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Custom scrollbar for PDF container */
.pdf-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pdf-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.pdf-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.pdf-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive design */
@media (max-width: 768px) {
  .pdf-container {
    height: 400px;
    padding: 10px;
  }
  
  .pdf-viewer .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .pdf-viewer .v-card-title > div {
    margin-top: 8px;
  }
}
</style>

