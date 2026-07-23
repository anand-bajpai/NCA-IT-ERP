import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.ncaitsolution.com";

const SEO = ({ title, description, path = "/", keywords, schema }) => {
  const fullTitle = title
    ? `${title} | NCA IT Solution`
    : "NCA IT Solution | Web Development, App Development & IT Training in Noida";

  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />

      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}

      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
