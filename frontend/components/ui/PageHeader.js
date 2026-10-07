import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, text, crumbs, children }) {
  return (
    <div className="border-b-2 border-black bg-bone">
      <div className="container-site py-8 sm:py-12">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="display mt-3 text-5xl sm:text-7xl">{title}</h1>
        {text && <p className="mt-3 max-w-2xl text-lg text-mute">{text}</p>}
        {children}
      </div>
    </div>
  );
}
