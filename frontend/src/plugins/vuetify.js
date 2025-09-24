import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

// Material Design 3 Color Palette
const lightTheme = {
  dark: false,
  colors: {
    primary: '#6750A4',      // Material Design 3 Primary
    secondary: '#625B71',     // Material Design 3 Secondary
    tertiary: '#7D5260',     // Material Design 3 Tertiary
    surface: '#FFFBFE',      // Material Design 3 Surface
    'surface-variant': '#E7E0EC', // Material Design 3 Surface Variant
    background: '#FFFBFE',   // Material Design 3 Background
    error: '#BA1A1A',        // Material Design 3 Error
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-tertiary': '#FFFFFF',
    'on-surface': '#1C1B1F',
    'on-surface-variant': '#49454F',
    'on-background': '#1C1B1F',
    'on-error': '#FFFFFF',
    outline: '#79747E',
    'outline-variant': '#CAC4D0',
    shadow: '#000000',
    'scrim': '#000000',
    'inverse-surface': '#313033',
    'inverse-on-surface': '#F4EFF4',
    'inverse-primary': '#D0BCFF'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#D0BCFF',      // Material Design 3 Primary Dark
    secondary: '#CCC2DC',    // Material Design 3 Secondary Dark
    tertiary: '#EFB8C8',     // Material Design 3 Tertiary Dark
    surface: '#1C1B1F',      // Material Design 3 Surface Dark
    'surface-variant': '#49454F', // Material Design 3 Surface Variant Dark
    background: '#1C1B1F',  // Material Design 3 Background Dark
    error: '#FFB4AB',        // Material Design 3 Error Dark
    'on-primary': '#381E72',
    'on-secondary': '#332D41',
    'on-tertiary': '#492532',
    'on-surface': '#E6E1E5',
    'on-surface-variant': '#CAC4D0',
    'on-background': '#E6E1E5',
    'on-error': '#690005',
    outline: '#938F99',
    'outline-variant': '#49454F',
    shadow: '#000000',
    'scrim': '#000000',
    'inverse-surface': '#E6E1E5',
    'inverse-on-surface': '#313033',
    'inverse-primary': '#6750A4'
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none; font-weight: 500;'
    },
    VCard: {
      elevation: 1
    },
    VTextField: {
      variant: 'outlined'
    },
    VSelect: {
      variant: 'outlined'
    },
    VTextarea: {
      variant: 'outlined'
    }
  }
})
