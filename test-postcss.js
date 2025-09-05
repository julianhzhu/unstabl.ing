const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs");

const css = fs.readFileSync("./styles/globals.css", "utf8");

postcss([tailwindcss, autoprefixer])
  .process(css, { from: "./styles/globals.css" })
  .then((result) => {
    fs.writeFileSync("./test-output.css", result.css);
    console.log("CSS processed successfully!");
    console.log("Output size:", result.css.length, "characters");
  })
  .catch((err) => {
    console.error("Error processing CSS:", err);
  });
