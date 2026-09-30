// Design source: colors extracted directly from the decoded Tamboo Customer App prototype.
export const colors = {
  bg: '#fffafc',
  surface: '#ffffff',
  text: '#1e1b2e',
  textSoft: '#6b6580',
  textMuted: '#8a8499',
  divider: '#f0e3ea',
  dividerStrong: '#e3cfd9',
  inputBg: '#f7edf1',
  maroon: '#4d0013',
  pink: '#e75480',
  pinkStrong: '#a0133f',
  pinkBg: '#fdeef3',
  green: '#047857',
  greenBg: '#e8f7f0',
  danger: '#b91c1c',
  dangerStrong: '#dc2626',
  dangerBg: '#fdecec',
  amber: '#8a5a00',
  amberBg: '#fff4e5',
  purpleBg: '#f3eefd',
};

// Design source: linear-gradient(135deg, #4d0013, #e75480) on every primary CTA and selected state.
export const gradients = {
  primaryButton: {
    colors: [colors.maroon, colors.pink],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const shadow = {
  card: {
    shadowColor: colors.maroon,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButton: {
    shadowColor: colors.pink,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};
