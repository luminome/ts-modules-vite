//vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // conf: resolve(__dirname, 'src/conf/index.html')
      },
      output: {
        entryFileNames: 'entry-[name].js'
      }
    }
  }
});

// export default {
//   ...,
//   input: {
//     a: 'src/main-a.js',
//     'b/index': 'src/main-b.js'
//   },
//   output: {
//     ...,
//     entryFileNames: 'entry-[name].js'
//   }
// };



// import { glob } from 'glob';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { defineConfig } from 'vite'

// // console.log(glob);

// export default defineConfig({
//   build: {
//     rollupOptions: {
//       input: Object.fromEntries(
//         // console.log( glob.sync('src/**/*.ts') ),path.join(dir, '*.js')
//         // console.log(path.join(__dirname, 'src/**/*.ts')) &&
        
//         glob.sync('src/**/*.ts').map(file => [
//           // This remove `src/` as well as the file extension from each
//           // file, so e.g. src/nested/foo.js becomes nested/foo
//           path.relative(
//             'src',
//             file.slice(0, file.length - path.extname(file).length)
//           ),
//           // This expands the relative paths to absolute paths, so e.g.
//           // src/nested/foo becomes /project/src/nested/foo.js
//           fileURLToPath(new URL(file, import.meta.url))
//         ])
//       ),
//       output: {
//         format: 'es',
//         dir: 'dist'
//       },
//     },  
//   }
// });

// import { resolve } from 'path';
// import { defineConfig } from 'vite'

// export default defineConfig({
//   build: {
//     rollupOptions: {
//       input: {
//         main: resolve(__dirname, 'index.html'),
//         conf: resolve(__dirname, 'src/conf/index.html')
//       }
//     }
//   }
// });

