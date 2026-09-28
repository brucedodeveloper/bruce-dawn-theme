module.exports = {
  prefix: 'twcss-',
  content: [
    './layout/*.liquid',
    './templates/*.liquid',
    './templates/customers/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
  ],
  theme: {
    screens: {
      sm: '320px',
      md: '750px',
      lg: '990px',
      xlg: '1440px',
      x2lg: '1920px',
      pageMaxWidth: '1440px',
    },
    fontFamily: {
      sans: ['BalsamiqSans', 'sans-serif'],
      heading: 'var(--font-heading-family)',
    },
    fontSize: {
      'base-bold': [
        '16px',
        { lineHeight: '26px', letterSpacing: '0.16px', fontWeight: 700 },
      ],
      base: [
        '16px',
        { lineHeight: '26px', letterSpacing: '0.16px', fontWeight: 400 },
      ],
      'sm-bold': [
        '14px',
        { lineHeight: '22px', letterSpacing: '0.14px', fontWeight: 700 },
      ],
      sm: [
        '14px',
        { lineHeight: '22px', letterSpacing: '0.14px', fontWeight: 400 },
      ],
      'xs-bold': [
        '12px',
        { lineHeight: '19px', letterSpacing: '0.12px', fontWeight: 700 },
      ],
      xs: [
        '12px',
        { lineHeight: '19px', letterSpacing: '0.12px', fontWeight: 400 },
      ],
      button: [
        '16px',
        { lineHeight: '20px', letterSpacing: '0.32px', fontWeight: 400 },
      ],
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E1E1E',
        },
        secondary: {
          DEFAULT: '#B3B3B3',
        },
        grey: {
          100: '#F5F5F5',
          200: '#757575',
        },
      },
      spacing: {
        0.5: '2px',
        0.75: '3px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        10.5: '42px',
        35: '140px',
      },
      zIndex: {
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        6: '6',
        7: '7',
        8: '8',
        9: '9',
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
