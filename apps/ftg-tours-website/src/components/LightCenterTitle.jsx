/**
 * LightCenterTitle.jsx — centred section heading with a `light` colour switch.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `Oi`
 *   (`function Oi({children:e,light:t})`). Note the breakpoints differ from
 *   CenterTitle (`md:` here vs `sm:` there) and it takes `children`, not `title`.
 */
export default function LightCenterTitle({ children, light }) {
  return (
    <h2 className={`text-2xl md:text-3xl font-bold mb-8 md:mb-10 text-center ${light ? 'text-white' : 'text-ftg-forest'}`}>
      {children}
    </h2>
  );
}
