<template>
  <v-card class="signature-pad" elevation="4">
    <v-card-title class="d-flex align-center justify-space-between">
      <span class="text-h6 font-weight-bold">Digital Signature</span>
      <div class="d-flex align-center">
        <v-btn
          color="error"
          outlined
          small
          @click="clearSignature"
          class="mr-2"
        >
          <v-icon left>mdi-delete</v-icon>
          Clear
        </v-btn>
        <v-btn
          color="primary"
          @click="saveSignature"
          :disabled="isEmpty"
        >
          <v-icon left>mdi-check</v-icon>
          Save Signature
        </v-btn>
      </div>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text class="pa-4">
      <div class="signature-container">
        <canvas
          ref="signatureCanvas"
          class="signature-canvas"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
        ></canvas>
      </div>
      
      <div class="signature-preview mt-4" v-if="signaturePreview">
        <h4 class="text-subtitle-1 font-weight-bold mb-2">Signature Preview:</h4>
        <div class="preview-container">
          <img :src="signaturePreview" alt="Signature Preview" class="preview-image">
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'SignaturePad',
  data() {
    return {
      canvas: null,
      ctx: null,
      isDrawing: false,
      isEmpty: true,
      signaturePreview: null,
      lastX: 0,
      lastY: 0
    }
  },
  mounted() {
    this.initCanvas()
  },
  methods: {
    initCanvas() {
      this.canvas = this.$refs.signatureCanvas
      this.ctx = this.canvas.getContext('2d')
      
      // Set canvas size
      this.resizeCanvas()
      
      // Set drawing styles
      this.ctx.strokeStyle = '#000000'
      this.ctx.lineWidth = 2
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      
      // Clear canvas
      this.clearCanvas()
      
      // Handle window resize
      window.addEventListener('resize', this.resizeCanvas)
    },
    
    resizeCanvas() {
      const container = this.canvas.parentElement
      const rect = container.getBoundingClientRect()
      
      this.canvas.width = rect.width - 32 // Account for padding
      this.canvas.height = 200
      
      // Redraw if there's content
      if (!this.isEmpty) {
        this.redrawSignature()
      }
    },
    
    getEventPos(e) {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        }
      } else {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        }
      }
    },
    
    startDrawing(e) {
      e.preventDefault()
      this.isDrawing = true
      this.isEmpty = false
      
      const pos = this.getEventPos(e)
      this.lastX = pos.x
      this.lastY = pos.y
      
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
    },
    
    draw(e) {
      if (!this.isDrawing) return
      
      e.preventDefault()
      
      const pos = this.getEventPos(e)
      
      this.ctx.lineTo(pos.x, pos.y)
      this.ctx.stroke()
      
      this.lastX = pos.x
      this.lastY = pos.y
    },
    
    stopDrawing() {
      if (this.isDrawing) {
        this.isDrawing = false
        this.ctx.beginPath()
      }
    },
    
    clearSignature() {
      this.clearCanvas()
      this.isEmpty = true
      this.signaturePreview = null
      this.$emit('signature-cleared')
    },
    
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // No background fill - keep transparent
    },
    
    saveSignature() {
      if (this.isEmpty) {
        this.$emit('error', 'Please draw a signature first')
        return
      }
      
      try {
        const dataURL = this.canvas.toDataURL('image/png')
        this.signaturePreview = dataURL
        
        this.$emit('signature', dataURL)
        
        this.$emit('success', 'Signature saved successfully!')
      } catch (error) {
        console.error('Error saving signature:', error)
        this.$emit('error', 'Failed to save signature')
      }
    },
    
    redrawSignature() {
      // This method can be used to redraw signature if needed
      // For now, we'll just clear and let user redraw
      this.clearCanvas()
    }
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCanvas)
  }
}
</script>

<style scoped>
.signature-pad {
  height: 100%;
}

.signature-container {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: 
    linear-gradient(45deg, #f5f5f5 25%, transparent 25%), 
    linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #f5f5f5 75%), 
    linear-gradient(-45deg, transparent 75%, #f5f5f5 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  transition: border-color 0.3s ease;
}

.signature-container:hover {
  border-color: #1976D2;
}

.signature-canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: transparent;
  cursor: crosshair;
  display: block;
  width: 100%;
  height: 200px;
}

.signature-preview {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.preview-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background: white;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 100px;
  border-radius: 4px;
}

/* Responsive design */
@media (max-width: 768px) {
  .signature-canvas {
    height: 150px;
  }
  
  .signature-pad .v-card-title {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .signature-pad .v-card-title > div {
    margin-top: 8px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .signature-canvas {
    height: 180px;
  }
  
  .signature-container {
    padding: 12px;
  }
}
</style>
