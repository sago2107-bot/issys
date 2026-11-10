/**
 * Identidad visual ISSyS (ISSyS-brand-guidelines.md) para Tailwind, compartida por index.html y modelador.html.
 *
 * Las escalas de Tailwind se redefinen sobre la paleta institucional, así las clases existentes
 * (slate, cyan, emerald, amber, rose…) toman los colores de marca sin reescribirlas:
 *   slate/gray → neutros de marca (ink #1D1D1B, gris claro #C6C6C6, superficie #F5F6F8)
 *   cyan/sky/blue/indigo → Azul ISSyS #4657A0 (600) y #36457F (700)
 *   teal/emerald/green → Verde ISSyS #59B57E (500) y verde oscuro accesible #2F7D50 (600)
 *   amber/yellow/orange → Amarillo #F9D76B (300); los tonos de texto (600+) son oscuros y accesibles
 *   rose/red → rojo de error #B3261E (600)
 * Los 500 hacia abajo son fondos o decoración; para texto sobre blanco usar 600 o más.
 */
(function () {
    const neutro = { 50: '#F5F6F8', 100: '#EDEEF1', 200: '#E1E2E5', 300: '#C6C6C6', 400: '#767676', 500: '#5F5F5F', 600: '#4B4B49', 700: '#363634', 800: '#262624', 900: '#1D1D1B', 950: '#121211' };
    const azul = { 50: '#F1F3F9', 100: '#E3E6F1', 200: '#C9CEE5', 300: '#A5ADD3', 400: '#7783BC', 500: '#5A69AE', 600: '#4657A0', 700: '#36457F', 800: '#2B3766', 900: '#222B4F', 950: '#161C33' };
    const verde = { 50: '#F3FAF6', 100: '#E6F3EB', 200: '#C6E6D2', 300: '#9DD4B3', 400: '#79C597', 500: '#59B57E', 600: '#2F7D50', 700: '#276843', 800: '#1F5536', 900: '#18432B', 950: '#0E2A1B' };
    const amarillo = { 50: '#FEFBEF', 100: '#FDF3D3', 200: '#FBE8A7', 300: '#F9D76B', 400: '#F5C94A', 500: '#EDB82A', 600: '#8A6508', 700: '#6E5006', 800: '#573F06', 900: '#3F2E05', 950: '#2A1F03' };
    const rojo = { 50: '#FCF1F0', 100: '#F9DEDC', 200: '#F2B8B5', 300: '#E8918C', 400: '#DB6560', 500: '#C83E37', 600: '#B3261E', 700: '#8C1D18', 800: '#6E1712', 900: '#52110D', 950: '#340A08' };

    window.tailwind = window.tailwind || {};
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    slate: neutro, gray: neutro, zinc: neutro,
                    cyan: azul, sky: azul, blue: azul, indigo: azul,
                    teal: verde, emerald: verde, green: verde,
                    amber: amarillo, yellow: amarillo, orange: amarillo,
                    rose: rojo, red: rojo,
                    issys: {
                        green: '#59B57E', 'green-dark': '#2F7D50', 'green-tint': '#E6F3EB',
                        blue: '#4657A0', 'blue-dark': '#36457F', 'blue-tint': '#E3E6F1',
                        gray: '#878787', 'gray-light': '#C6C6C6', yellow: '#F9D76B',
                        ink: '#1D1D1B', surface: '#F5F6F8',
                        // Nombres anteriores de la app, apuntando a la paleta de marca
                        navy: '#1D1D1B', dark: '#36457F', primary: '#4657A0', accent: '#2F7D50', cyan: '#4657A0', light: '#F5F6F8', slate: '#363634'
                    }
                },
                // Escala tipográfica: 2px más grande que la de Tailwind (la condensada se lee más chica)
                fontSize: {
                    xs: ['14px', '18px'],
                    sm: ['16px', '22px'],
                    base: ['18px', '26px'],
                    lg: ['20px', '28px'],
                    xl: ['22px', '30px'],
                    '2xl': ['28px', '34px'],
                    '3xl': ['34px', '40px'],
                    '4xl': ['40px', '46px']
                },
                fontFamily: {
                    sans: ['"Encode Sans Condensed"', '"Arial Narrow"', 'Arial', 'sans-serif'],
                    mono: ['"JetBrains Mono"', 'monospace']
                },
                // Pesos del manual: Light 300, Regular 400, Semibold 600, Black 900
                fontWeight: { medium: '600', bold: '600', extrabold: '900' }
            }
        }
    };
})();
