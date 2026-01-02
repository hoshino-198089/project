import { defineConfig } from 'vite';
import license from 'rollup-plugin-license';

export default defineConfig({
  base: './',
  plugins: [
    {
      ...license({
        thirdParty: {
          output: {
            file: './dist/dependencies.txt',
            template(dependencies) {
              return dependencies.map(dep => `${dep.name} ${dep.version} ${dep.license}`).join('\n');
            }
          }
        }
      }),
      apply: 'build',
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  }
});
