/**
 * Cấu hình Tailwind dùng CHUNG cho mọi trang.
 * Trước đây khối này bị sao chép y hệt vào 11 file HTML — nay chỉ còn 1 nơi duy nhất.
 * Muốn đổi màu/font toàn web: sửa tại đây.
 */
tailwind.config = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "secondary-fixed-dim": "#86efac",
        "on-surface-variant": "#475569",
        "inverse-surface": "#2e3130",
        "secondary": "#14532d",
        "on-secondary-fixed-variant": "#005320",
        "inverse-on-surface": "#eff1ef",
        "surface-bright": "#ffffff",
        "on-primary-container": "#b4ffba",
        "on-primary": "#ffffff",
        "surface-container-low": "#f0fdf4",
        "surface-dim": "#bbf7d0",
        "on-background": "#0f172a",
        "on-tertiary-fixed-variant": "#5b4300",
        "on-error-container": "#93000a",
        "background": "#f0fdf4",
        "error": "#ba1a1a",
        "surface-container": "#dcfce7",
        "on-error": "#ffffff",
        "tertiary-fixed-dim": "#fbbf24",
        "surface-tint": "#15803d",
        "on-primary-fixed-variant": "#005320",
        "surface-variant": "#dcfce7",
        "outline-variant": "#86efac",
        "surface-container-high": "#dcfce7",
        "surface-container-highest": "#dcfce7",
        "on-primary-fixed": "#002109",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#14532d",
        "tertiary-container": "#f59e0b",
        "secondary-container": "#dcfce7",
        "tertiary-fixed": "#fef3c7",
        "surface": "#ffffff",
        "primary-fixed": "#bbf7d0",
        "on-tertiary-fixed": "#251a00",
        "on-surface": "#0f172a",
        "error-container": "#ffdad6",
        "on-tertiary": "#ffffff",
        "tertiary": "#92400e",
        "on-tertiary-container": "#ffebc7",
        "secondary-fixed": "#dcfce7",
        "surface-container-lowest": "#ffffff",
        "outline": "#475569",
        "primary": "#15803d",
        "inverse-primary": "#80da8d",
        "primary-fixed-dim": "#80da8d",
        "primary-container": "#14532d",
        "sky": "#2563eb",
        "sun": "#f59e0b",
        "berry": "#ec4899",
        "on-secondary-fixed": "#002108"
      },
      "borderRadius": {
        "DEFAULT": "1rem",
        "lg": "1.25rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      "spacing": {
        "space-sm": "0.75rem",
        "space-lg": "2rem",
        "space-md": "1.25rem",
        "margin-mobile": "1.25rem",
        "space-xs": "0.375rem",
        "space-xl": "3rem",
        "margin": "2.5rem",
        "gutter-mobile": "1rem",
        "gutter": "1.5rem"
      },
      "fontFamily": {
        "headline-lg": [
          "Nunito"
        ],
        "headline-md": [
          "Nunito"
        ],
        "label-lg": [
          "Nunito"
        ],
        "body-lg": [
          "Nunito Sans"
        ],
        "headline-lg-mobile": [
          "Nunito"
        ],
        "body-md": [
          "Nunito Sans"
        ],
        "label-md": [
          "Nunito"
        ],
        "label-sm": [
          "Nunito"
        ],
        "headline-xl-mobile": [
          "Nunito"
        ],
        "body-sm": [
          "Nunito Sans"
        ],
        "headline-sm": [
          "Nunito"
        ],
        "headline-xl": [
          "Nunito"
        ]
      },
      "fontSize": {
        "headline-lg": [
          "32px",
          {
            "lineHeight": "44px",
            "fontWeight": "800"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "34px",
            "fontWeight": "800"
          }
        ],
        "label-lg": [
          "18px",
          {
            "lineHeight": "26px",
            "fontWeight": "800"
          }
        ],
        "body-lg": [
          "20px",
          {
            "lineHeight": "32px",
            "fontWeight": "500"
          }
        ],
        "headline-lg-mobile": [
          "26px",
          {
            "lineHeight": "36px",
            "fontWeight": "800"
          }
        ],
        "body-md": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "500"
          }
        ],
        "label-md": [
          "16px",
          {
            "lineHeight": "22px",
            "fontWeight": "600"
          }
        ],
        "label-sm": [
          "13px",
          {
            "lineHeight": "18px",
            "fontWeight": "600"
          }
        ],
        "headline-xl-mobile": [
          "30px",
          {
            "lineHeight": "40px",
            "fontWeight": "800"
          }
        ],
        "body-sm": [
          "15px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "headline-sm": [
          "20px",
          {
            "lineHeight": "30px",
            "fontWeight": "800"
          }
        ],
        "headline-xl": [
          "40px",
          {
            "lineHeight": "52px",
            "fontWeight": "800"
          }
        ]
      }
    }
  }
};
