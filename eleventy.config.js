const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // Statik dosyalar olduğu gibi kopyalansın
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("logo.webp");
  eleventyConfig.addPassthroughCopy("email-templates");

  // Blog koleksiyonu
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/blog/*.md").sort(function(a, b) {
      return b.date - a.date;
    });
  });

  // Tarih formatı filtresi (Türkçe)
  eleventyConfig.addFilter("turkishDate", function(date) {
    var months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
                   "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date(date);
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  });

  // Global Data: settings.json
  eleventyConfig.addGlobalData("site", function() {
    var settingsPath = path.join(__dirname, "content", "settings.json");
    try {
      var raw = fs.readFileSync(settingsPath, "utf8");
      return JSON.parse(raw);
    } catch(e) {
      return {
        site_name: "SH Danışmanlık",
        phone: "+90 534 705 42 34",
        phone_raw: "905347054234",
        email: "info@shdanismanlik.com",
        address: "Ümraniye, İstanbul",
        whatsapp: "905347054234",
        footer_slogan: "Bize Uğrayın, Bürokrasiye Takılmayın",
        copyright_year: "2026",
        social: { linkedin: "#", twitter: "#", instagram: "#" }
      };
    }
  });

  // Global Data: homepage.json
  eleventyConfig.addGlobalData("homepage", function() {
    var homePath = path.join(__dirname, "content", "homepage.json");
    try {
      var raw = fs.readFileSync(homePath, "utf8");
      return JSON.parse(raw);
    } catch(e) {
      return {};
    }
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes"
    },
    templateFormats: ["html", "md", "njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
