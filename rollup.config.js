import pkg from "./package.json";
import commonjs from "rollup-plugin-commonjs";
import progress from "rollup-plugin-progress";
import babel from "rollup-plugin-babel";
import {
  terser
} from "rollup-plugin-terser";
import cleanup from "rollup-plugin-cleanup";
import del from "rollup-plugin-delete";
import typescript from "rollup-plugin-typescript2";

export default {
  input: "./src/index.ts",
  output: [{
      file: pkg.main,
      format: "cjs"
    },
    {
      file: pkg.module,
      format: "es"
    }
  ],
  plugins: [
    progress({
      clearLines: false
    }),
    del({
      targets: [
        "lib/*"
      ]
    }),
    babel({
      exclude: "node_modules/**"
    }),
    commonjs({
      namedExports: {}
    }),
    typescript({
      tsconfigOverride: {
        exclude: ["./__tests__"]
      }
    }),
    terser(),
    cleanup()
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
  ]
}