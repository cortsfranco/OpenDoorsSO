/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
<<<<<<< HEAD
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
=======
>>>>>>> refs/remotes/origin/master
    extend: {
      colors: {
        income: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        expense: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        iva: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
<<<<<<< HEAD
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        fiscal: {
          iva: "hsl(var(--fiscal-iva))",
          "iva-foreground": "hsl(var(--fiscal-iva-foreground))",
          balance: "hsl(var(--fiscal-balance))",
          "balance-foreground": "hsl(var(--fiscal-balance-foreground))",
          earnings: "hsl(var(--fiscal-earnings))",
          "earnings-foreground": "hsl(var(--fiscal-earnings-foreground))",
          debt: "hsl(var(--fiscal-debt))",
          "debt-foreground": "hsl(var(--fiscal-debt-foreground))",
          credit: "hsl(var(--fiscal-credit))",
          "credit-foreground": "hsl(var(--fiscal-credit-foreground))",
          neutral: "hsl(var(--fiscal-neutral))",
          "neutral-foreground": "hsl(var(--fiscal-neutral-foreground))",
        },
        invoice: {
          pending: "hsl(var(--invoice-pending))",
          approved: "hsl(var(--invoice-approved))",
          rejected: "hsl(var(--invoice-rejected))",
          processing: "hsl(var(--invoice-processing))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
=======
        balance: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
>>>>>>> refs/remotes/origin/master
    },
  },
  plugins: [],
}