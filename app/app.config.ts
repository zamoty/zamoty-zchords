export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      neutral: 'zinc'
    },

    container: {
      // mobile-first, but avoids ultra-wide reading lines on tablets/desktop
      base: 'w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8'
    },

    select: {
      slots: {
        content: 'min-w-fit'
      }
    },

    button: {
      variants: {
        size: {
          xs: {
            base: 'px-2 py-1 text-xs gap-1',
            trailingIcon: 'size-4'
          },
          sm: {
            // readability bump (mobile-first)
            base: 'px-2.5 py-1.5 text-sm gap-1.5',
            leadingIcon: 'size-4',
            trailingIcon: 'size-4'
          },
          md: {
            base: 'px-3 py-2 text-sm gap-1.5',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          },
          lg: {
            base: 'px-3.5 py-2.5 text-sm gap-2',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          },
          xl: {
            base: 'px-4 py-3 text-base gap-2.5',
            leadingIcon: 'size-6',
            trailingIcon: 'size-6'
          }
        }
      }
    },

    dashboardPanel: {
      slots: {
        root: '',
        body: 'p-4'
      }
    },

    dashboardSidebar: {
      slots: {
        root: '',
        body: ''
      }
    },

    dashboardNavbar: {
      slots: {
        root: '',
        left: '',
        center: '',
        right: ''
      }
    },

    dashboardToolbar: {
      slots: {
        root: ''
      }
    },

    navigationMenu: {
      props: {
        color: 'primary',
        variant: 'pill',
        orientation: 'vertical',
        highlight: false,
        highlightColor: 'primary',
        collapsed: false
      },
      slots: {
        root: 'w-full'
      }
    },

    card: {
      defaultVariants: {
        variant: 'subtle'
      }
    }
  }
})
