import js from '@eslint/js'
import hooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
export default [
  { ignores: ['dist/**', '.output/**', '.tanstack/**', 'node_modules/**', 'src/routeTree.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], plugins: { 'react-hooks': hooks }, rules: { ...hooks.configs.recommended.rules, '@typescript-eslint/no-explicit-any':'off', '@typescript-eslint/no-unused-vars': 'off', 'no-undef': 'off', 'no-unused-vars': 'off' } },
]
