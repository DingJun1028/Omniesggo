# DESIGN.md — Corporate Trust

## Personality
Credible, orderly, accessible. Clarity over cleverness; WCAG AA everywhere.

## Colors
- Primary navy: #0F2A47 (headers, footer, primary text on light)
- Action blue: #1F5FA8 (buttons, links); hover #174A85
- Background: #F3F6FA (page), #FFFFFF (surfaces); border #D6DEE8
- Text: #0F2A47 primary, #4A5A6A secondary
- Semantic: success #2E7D32, warning #B26A00, danger #B3261E — always with an icon or label, never color alone

## Typography
- Headings: IBM Plex Sans 600, 40/30/24/20
- Body: IBM Plex Sans 16px/1.6; long-form in IBM Plex Serif 17px
- Minimum 14px anywhere; 4.5:1 contrast minimum

## Layout & spacing
- 12-column grid, 24px gutters, max width 1200px
- Section padding 80px; consistent 24/32/48 spacing tokens
- Cards: white, 1px border, radius 6px, optional 2px navy top rule for emphasis

## Components
- Buttons: 44px, radius 4px; primary action-blue, secondary white with navy border
- Forms: labels above fields, helper text below, 44px inputs, visible focus outline 2px
- Header: white, navy wordmark, utility bar above nav for contact/login
- Data: tables with header row in #F3F6FA, sortable indicators, 48px rows
- Trust elements: certifications strip, security statement, clear contact info in footer

## Motion
- Subtle only (150ms); respect prefers-reduced-motion

## Do / Don't
- Do: accessible contrast, descriptive link text, structured content with headings
- Don't: decorative gradients, novelty fonts, autoplaying media, low-contrast gray text
