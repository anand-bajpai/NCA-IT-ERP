import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import siteConfig from "../config/siteConfig";

// Provides the SAME shape as siteConfig (companyName, phone, address, social...)
// so existing components can switch from `siteConfig.x` to `site.x` with a
// one-line import change. Falls back to the static siteConfig values for
// any field the Super Admin hasn't filled in yet in Institute Settings —
// the public website never breaks or shows blank data.
const InstituteSettingsContext = createContext(siteConfig);

function mergeWithDefaults(data = {}) {
  return {
    ...siteConfig,
    companyName: data.instituteName || siteConfig.companyName,
    shortName: data.shortName || siteConfig.companyName,
    phone: data.Phone || siteConfig.phone,
    phoneDisplay: data.Phone || siteConfig.phoneDisplay,
    email: data.Email || siteConfig.email,
    supportEmail: data.SupportEmail || data.Email || siteConfig.email,
    supportPhone: data.SupportPhone || data.Phone || siteConfig.phone,
    website: data.Website || "",
    logo: data.logo ? `${siteConfig.apiBaseUrl}${data.logo}` : "",
    favicon: data.favicon ? `${siteConfig.apiBaseUrl}${data.favicon}` : "",
    gstNumber: data.GSTNumber || "",
    googleMapLink: data.GoogleMapLink || "",
    directorName: data.DirectorName || "",
    address: {
      line1: data.Address || siteConfig.address.line1,
      // The admin panel now collects address as a single "Full Address"
      // field (no separate City/State inputs), so line2 must not repeat
      // any leftover City/State values from older data — doing so caused
      // the address to appear duplicated (e.g. "...Uttar Pradesh, noida,
      // Uttar Pradesh"). line2 only falls back to the static default when
      // no Address has been saved yet.
      line2: data.Address ? "" : siteConfig.address.line2,
      full: data.Address || siteConfig.address.full,
    },
    hours: siteConfig.hours,
    social: {
      whatsapp: data.WhatsApp
        ? `https://wa.me/${String(data.WhatsApp).replace(/\D/g, "")}`
        : siteConfig.social.whatsapp,
      linkedin: data.LinkedIn || siteConfig.social.linkedin,
      instagram: data.Instagram || siteConfig.social.instagram,
      facebook: data.Facebook || siteConfig.social.facebook,
      youtube: data.YouTube || siteConfig.social.youtube,
      twitter: data.Twitter || "#",
    },
  };
}

export const InstituteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(siteConfig);

  const refresh = () => {
    return axios
      .get(`${siteConfig.apiBaseUrl}/api/settings/public`)
      .then((res) => {
        if (res.data?.success) {
          setSettings(mergeWithDefaults(res.data.data));
        }
      })
      .catch(() => {
        // Public site must never break — silently keep current values.
      });
  };

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${siteConfig.apiBaseUrl}/api/settings/public`)
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setSettings(mergeWithDefaults(res.data.data));
        }
      })
      .catch(() => {
        // Public site must never break — silently keep static defaults.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InstituteSettingsContext.Provider value={{ ...settings, refresh }}>
      {children}
    </InstituteSettingsContext.Provider>
  );
};

// Drop-in replacement for `import siteConfig from ".../siteConfig"` inside
// components that should reflect live Institute Settings.
export const useInstituteSettings = () => useContext(InstituteSettingsContext);

export default InstituteSettingsContext;
