/**
 * CenterTitle.jsx — plain centred section heading.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `ei`
 *   (`function ei({title:e})`). Distinct from HtbSectionHeader, which is
 *   left-aligned and wraps a <div>; this one renders a bare centred <h2>.
 */
export default function CenterTitle({ title }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold text-ftg-forest mb-8 sm:mb-10 text-center">
      {title}
    </h2>
  );
}
