# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [14.2.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@14.1.2...@homer0/eslint-plugin@14.2.0) (2025-12-02)

### Bug Fixes

- **eslint-plugin:** add esm as the first config ([4947f90](https://github.com/homer0/packages/commit/4947f90f41bb139402c6253e647ba7ce05c888c2))
- **eslint-plugin:** disable n rules for import in favor of import-x ([630b1e7](https://github.com/homer0/packages/commit/630b1e7e8ee812943330ab8922d88adc4c24f233))
- **eslint-plugin:** esm default is now false ([00be4f6](https://github.com/homer0/packages/commit/00be4f69fe46ba731440fdab2fa123536dd78d27))
- **eslint-plugin:** include storybook, prettier, and tests as dev files ([d7c2901](https://github.com/homer0/packages/commit/d7c29014400c408d106fe7a8740be3f41138aac1))
- **eslint-plugin:** move missing import rules to ts rules config ([2dba98c](https://github.com/homer0/packages/commit/2dba98c5f29af0ebac0cbdac35b3d2f6623818ef))
- **eslint-plugin:** remove unnecessary rule set for bundling ([7a04600](https://github.com/homer0/packages/commit/7a0460038324b34a52f2267bddefbd53459296cf))
- **eslint-plugin:** remove unnecessary rule set for ts and esm ([3aa21a1](https://github.com/homer0/packages/commit/3aa21a15acc962d99c2caa8e81cee7afd0a76f87))
- **eslint-plugin:** set names to all the plugins configs ([045f871](https://github.com/homer0/packages/commit/045f87144fec212e1e2826918d7b4b2b68ed09b4))
- **eslint-plugin:** use .eslintignores as the default pattern ([70d5f19](https://github.com/homer0/packages/commit/70d5f19f050458c641033d82523d27c343aa9ca8))
- **monorepo:** update dependencies ([d6b8081](https://github.com/homer0/packages/commit/d6b8081d72b2773faa9909cc55b16ef1db57232d))

### Features

- **eslint-plugin:** add creator feature for no-unresolved ([86d0d72](https://github.com/homer0/packages/commit/86d0d7221bad79f8decc2b9c3fac1bc61b243f39))

## [14.1.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@14.1.1...@homer0/eslint-plugin@14.1.2) (2025-11-27)

### Bug Fixes

- **eslint-plugin:** add browser rules to disable node checks ([dfa408d](https://github.com/homer0/packages/commit/dfa408d3f8a25bd1e479d340af35c3cdad295b42))

## [14.1.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@14.1.0...@homer0/eslint-plugin@14.1.1) (2025-11-24)

### Bug Fixes

- **eslint-plugin:** add ts when creating a browser config for react ([ad40694](https://github.com/homer0/packages/commit/ad40694afc1a1158b4c28f78485bc0de6c70e963))

# [14.1.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@14.0.1...@homer0/eslint-plugin@14.1.0) (2025-11-24)

### Bug Fixes

- **eslint-plugin:** add peer dependencies for react ([e671b48](https://github.com/homer0/packages/commit/e671b48f65d38cbbd974c77f555e1ad712095b3e))
- **eslint-plugin:** disable react-in-jsx-scope for the react config ([28cfd3c](https://github.com/homer0/packages/commit/28cfd3c36feb803051f47b2efc934d61e1927a9a))
- **eslint-plugin:** extract the rules from the recommended configs for react ([2d94c58](https://github.com/homer0/packages/commit/2d94c58d9d45072fa59d63521e40bca6ef7b80ab))
- **eslint-plugin:** push tests config for browser base and rename base to baseConfig ([64d7791](https://github.com/homer0/packages/commit/64d779188306adeb0c344c8436168e68a6252f8d))
- **eslint-plugin:** split react rules and add them at the end of the configs ([25ca559](https://github.com/homer0/packages/commit/25ca559521f672fe5ec46ed400daf94b19b0d4b0))

### Features

- **eslint-plugin:** add creator for the react config ([e1fb393](https://github.com/homer0/packages/commit/e1fb39382dae014a98ab5c38277affa99be43b42))
- **eslint-plugin:** add react config ([194c386](https://github.com/homer0/packages/commit/194c38644f850723aee79ebce7b2556d1eba3a6c))

## [14.0.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@14.0.0...@homer0/eslint-plugin@14.0.1) (2025-11-22)

### Bug Fixes

- **eslint-plugin:** add types for browser globals as a prod dep ([914cf27](https://github.com/homer0/packages/commit/914cf27a818dc5bf538b5394f00eae9f34f09217))

# [14.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@13.0.0...@homer0/eslint-plugin@14.0.0) (2025-11-22)

### Bug Fixes

- **eslint-plugin:** add exports for the presets path ([f052f99](https://github.com/homer0/packages/commit/f052f99a6b5c9ffd8f7b0f12ba1a370343a52ff7))
- **eslint-plugin:** add extra exceptions for no-param-reassign ([33fbf5c](https://github.com/homer0/packages/commit/33fbf5c73619880deeaf87b1c3a04042551a5236))
- **eslint-plugin:** add name to the ignore by env var config ([5c3b920](https://github.com/homer0/packages/commit/5c3b920faf82f39139a3365edb424b15abc93daa))
- **eslint-plugin:** add names to all the rules configs ([3ca604f](https://github.com/homer0/packages/commit/3ca604f1d981c405971135a237384082c3e1e2b6))
- **eslint-plugin:** add overrides for extraneous deps on config files ([88213f5](https://github.com/homer0/packages/commit/88213f5958b108fc00c2ef4120b2e83eed68f42a))
- **eslint-plugin:** add ts rules to the nextjs config ([2f6651e](https://github.com/homer0/packages/commit/2f6651e74361303ecddfd2254e8101e1cff5a425))
- **eslint-plugin:** allow for partial options on the ignore file options ([fab3c90](https://github.com/homer0/packages/commit/fab3c90d81be6f2790b3912bb63700268a0ff3f0))
- **eslint-plugin:** allow the name of the ignore file to be customizable ([07eaf1d](https://github.com/homer0/packages/commit/07eaf1d47703c6ebc8b8d3136d0b6c640a9b3dfd))
- **eslint-plugin:** change presets to creators and use a shared fn on them ([7fe5f65](https://github.com/homer0/packages/commit/7fe5f652148afc5e50aedcc63034d0f2e17fe0bd))
- **eslint-plugin:** define files in the package.json ([850ffe9](https://github.com/homer0/packages/commit/850ffe9c2ea7bec9c392642a46e6a4b4368e5a63))
- **eslint-plugin:** disable esm validation of extensions for ts ([5a4b72a](https://github.com/homer0/packages/commit/5a4b72a28168d92439e1b9684e9bf789fb6521f4))
- **eslint-plugin:** disable no-unpublished-import ([ebce0ff](https://github.com/homer0/packages/commit/ebce0ff030b882a8adf76693132b5baefcceabc5))
- **eslint-plugin:** document the rewrite ([9186e21](https://github.com/homer0/packages/commit/9186e210add189125070578d749cea4b3672cf4a))
- **eslint-plugin:** document the rules decisions and remove some deprecated ones ([a0c026d](https://github.com/homer0/packages/commit/a0c026d78185107136c0138dab22f8e93d6415bd))
- **eslint-plugin:** enable ignore files by default in the config creator ([059b729](https://github.com/homer0/packages/commit/059b729bb11d67d5597b2031384d8e9294781c92))
- **eslint-plugin:** exclude .cjs config ([25bc5be](https://github.com/homer0/packages/commit/25bc5be555b02a558f355f83792fb27d8cbc6291))
- **eslint-plugin:** improve the fn to add prettier, both logic and types ([42c379b](https://github.com/homer0/packages/commit/42c379b3c4973eec7b4c9517d482889d8dff1bb8))
- **eslint-plugin:** include the n config before any overrides ([88850f9](https://github.com/homer0/packages/commit/88850f940474cca071a85ea346b5efab7c3949c7))
- **eslint-plugin:** install resolver for ts ([df62ce1](https://github.com/homer0/packages/commit/df62ce10a845e410291996a86cbb2545215d951d))
- **eslint-plugin:** make the min required version 20.19 ([d648bbe](https://github.com/homer0/packages/commit/d648bbecb0e1435afbd74f803040914708678802))
- **eslint-plugin:** move the code to ts ([266bcb1](https://github.com/homer0/packages/commit/266bcb185b1aeb057c1bb8d38b0595f583a681cb))
- **eslint-plugin:** properly type entry union ([0a28d09](https://github.com/homer0/packages/commit/0a28d09e23fea2e8c557235cc12e0558c9760075))
- **eslint-plugin:** remove react rules from the main dir ([6bad4ce](https://github.com/homer0/packages/commit/6bad4cef922f42fc7b76d5978d9b92666f3bb885))
- **eslint-plugin:** remove svelte rules ([61049df](https://github.com/homer0/packages/commit/61049df573dc576626605e7677f8275f7ce1551e))
- **eslint-plugin:** remove the jsdoc plugin from the base ([6ea82ff](https://github.com/homer0/packages/commit/6ea82ff69c0a35058af033525c5ad0e13feb8f59))
- **eslint-plugin:** remove utility to load ignore paths by env var ([89f5206](https://github.com/homer0/packages/commit/89f520672f936de19538597abe68a893f341e5f5))
- **eslint-plugin:** rename testing rules ([0e8938c](https://github.com/homer0/packages/commit/0e8938cc359aac0fbeb522671e45a10418c8650d))
- **eslint-plugin:** transpilation -> bundling ([651be6e](https://github.com/homer0/packages/commit/651be6ea8765a09a732d0f1295b5ad1fc0001580))
- **eslint-plugin:** use a ts-expect-error on the import to avoid issues in the implementations ([14b15a1](https://github.com/homer0/packages/commit/14b15a11a5b6cb6cd7765afe3da237eff3725e92))
- **eslint-plugin:** use Config type instead of Linter.Config ([1ad0117](https://github.com/homer0/packages/commit/1ad0117175483214e05f7d20319447b6ced0fd36))
- **eslint-plugin:** use eslint-plugin-import-x ([6435605](https://github.com/homer0/packages/commit/6435605a304b8b705830a2acd0aeeaecd4d5271f))
- **eslint-plugin:** use my node rules for node-ts ([45f0074](https://github.com/homer0/packages/commit/45f007459bb692a376c5defa4c3dffc82fa18a02))
- **eslint-plugin:** use recommended-module for node config ([1268702](https://github.com/homer0/packages/commit/12687026f1d4cd265476296acad2d68a7b8c8fe4))
- **eslint-plugin:** use satisfies for meta to avoid undefined ([497952a](https://github.com/homer0/packages/commit/497952a8b7638665809b7b06e17f2cc547e09886))
- **monorepo:** update all dependencies ([06b9893](https://github.com/homer0/packages/commit/06b98933257c18dd488f65d78e80b9d67c2294c0))
- **monorepo:** update all dependencies ([e828b6b](https://github.com/homer0/packages/commit/e828b6b4cc367b56fe3e8257f7366be43d431584))
- **monorepo:** update all dependencies ([ca9b9e7](https://github.com/homer0/packages/commit/ca9b9e7f5030805415150e918ff80c214e90bd29))

### Features

- **eslint-plugin:** add config for the ignore file to the configs creator ([f60d344](https://github.com/homer0/packages/commit/f60d344807d77f709f4947a86808cf0b09e71f3e))
- **eslint-plugin:** add configs for node, ts, note+ts, and testing ([fedace2](https://github.com/homer0/packages/commit/fedace21d93ea3314d73fab6fd002e5f16e2e143))
- **eslint-plugin:** add jsdoc config ([22f96e2](https://github.com/homer0/packages/commit/22f96e2285654190945f1429da9653cb94766d12))
- **eslint-plugin:** add nextjs config ([dbbda06](https://github.com/homer0/packages/commit/dbbda069d2047ab7cbf7504a0ab96ae357c7c34f))
- **eslint-plugin:** allow configuring the extraneous dependencies ([2b0b016](https://github.com/homer0/packages/commit/2b0b016d0fe5cbb8f1a212d57aafda92bc5deac3))
- **eslint-plugin:** create nextjs preset ([a73b97b](https://github.com/homer0/packages/commit/a73b97bf5c763fd8ff4e949b8e00af5cb10c14c9))
- **eslint-plugin:** create ts preset ([da8f29e](https://github.com/homer0/packages/commit/da8f29ed2d3eb6f03ac9a141a5670c3fa9e87ad9))

### BREAKING CHANGES

- **eslint-plugin:** If for some reason, you are not me, and you are using this
  plugin... sorry, I just rewrote it and it's 120% breaking.
- **eslint-plugin:** The package now requires node >= 20.19

# 13.0.0 (2025-09-21)

### Bug Fixes

- **eslint-plugin:** rename rules file from jest to testing ([79cd977](https://github.com/homer0/packages/commit/79cd977b6ff18a6715dcbc7145cc96b51a2eab47))
- **monorepo:** drop Node 18 support ([d1a1de6](https://github.com/homer0/packages/commit/d1a1de6cec1fd378aa3d874a42f8579389eb3c02))
- **monorepo:** update all dependencies ([230930d](https://github.com/homer0/packages/commit/230930dfdde66cdeb22ab73501d2d4c67106b44d))

### Features

- **eslint-plugin:** add config for testing without jest ([cf53e3b](https://github.com/homer0/packages/commit/cf53e3b94b6c8248eb6bc62a859cc8cdccbaa9fc))

### BREAKING CHANGES

- **monorepo:** Node 18 is not longer supported. Node 20 is the minimum required version now.

## [12.0.13](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.12...@homer0/eslint-plugin@12.0.13) (2025-05-24)

### Bug Fixes

- **eslint-plugin:** avoid using catalog on prod dependencies ([4473823](https://github.com/homer0/packages/commit/44738231913e0edc852b4be5f70a2e25c999e0f3))

## 12.0.12 (2025-05-24)

### Bug Fixes

- **monorepo:** use pnpm catalog for shared dependencies ([970dff4](https://github.com/homer0/packages/commit/970dff4d4f9e8bc019ee55f8031d0fc34c6a2774))

## [12.0.11](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.10...@homer0/eslint-plugin@12.0.11) (2025-05-10)

### Bug Fixes

- **monorepo:** update all dependencies ([bef5d8d](https://github.com/homer0/packages/commit/bef5d8d2dd8916ecc522233f8e832611e5532d03))

## [12.0.10](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.9...@homer0/eslint-plugin@12.0.10) (2025-04-14)

### Bug Fixes

- **eslint-plugin:** remove forOf instead of forIn from exception ([d607703](https://github.com/homer0/packages/commit/d60770321e250e68907be7dfb33707ab06b50fac))

## [12.0.9](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.8...@homer0/eslint-plugin@12.0.9) (2025-04-13)

### Bug Fixes

- **eslint-plugin:** allow for...of loops ([8f10ab2](https://github.com/homer0/packages/commit/8f10ab21307a4f411404033739bdf2c255b8fc4d))
- **eslint-plugin:** disable no-await-in-loop ([7aef3ef](https://github.com/homer0/packages/commit/7aef3ef0a1484c50f709ec4cfd9fbb70aed061be))
- **monorepo:** update dependencies ([3b99d37](https://github.com/homer0/packages/commit/3b99d370df44f0698a61f84547f0d31a72aa819f))

## [12.0.8](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.7...@homer0/eslint-plugin@12.0.8) (2025-01-25)

### Bug Fixes

- **eslint-plugin:** change engines req ([e5e7fd4](https://github.com/homer0/packages/commit/e5e7fd442aa62773d5dadfecd6003f29f97727e2))
- **monorepo:** update dependencies ([42fa7f3](https://github.com/homer0/packages/commit/42fa7f3df684bd0622b8c23d806e249785034b13))

## [12.0.7](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.6...@homer0/eslint-plugin@12.0.7) (2024-11-09)

### Bug Fixes

- **monorepo:** update dependencies ([3cf8287](https://github.com/homer0/packages/commit/3cf828796759009a74b473df0904fa84ec09f7ad))

## [12.0.6](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.5...@homer0/eslint-plugin@12.0.6) (2024-10-08)

### Bug Fixes

- **monorepo:** update all dependencies ([089b45d](https://github.com/homer0/packages/commit/089b45d3e63adfae5cefb3641a31c941d5613c92))

## [12.0.5](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.4...@homer0/eslint-plugin@12.0.5) (2024-05-18)

### Bug Fixes

- **monorepo:** update all dependencies ([b5e4ca8](https://github.com/homer0/packages/commit/b5e4ca81420dce38ddaceaa577def66a8064df85))

## [12.0.4](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.3...@homer0/eslint-plugin@12.0.4) (2024-04-06)

### Bug Fixes

- **eslint-plugin:** extend from transp for next config ([78d4fec](https://github.com/homer0/packages/commit/78d4fec519ffed68ead41ef0f56c623deda58d5b))
- **eslint-plugin:** include slices override to the react config ([8957995](https://github.com/homer0/packages/commit/8957995988f51978284beae64d3abde3c108a449))
- **monorepo:** update all dependencies ([89febc8](https://github.com/homer0/packages/commit/89febc8e7f8e2be2cbc0655f6452b10a22c86934))

## [12.0.3](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.2...@homer0/eslint-plugin@12.0.3) (2024-03-19)

### Bug Fixes

- **eslint-plugin:** add 100 as ignored magic number ([c0f5054](https://github.com/homer0/packages/commit/c0f5054284e0b480466e8327e044b387632cb53a))

## 12.0.2 (2024-02-22)

### Bug Fixes

- **monorepo:** update all dependencies ([dfd8005](https://github.com/homer0/packages/commit/dfd80057bf5a5259d0324ca5eecf6e42a58db817))

## [12.0.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@12.0.0...@homer0/eslint-plugin@12.0.1) (2023-12-23)

### Bug Fixes

- **monorepo:** update all dependencies ([2e55bc2](https://github.com/homer0/packages/commit/2e55bc20351f39fb52b9555f564102833e168dc1))

# [12.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@11.0.0...@homer0/eslint-plugin@12.0.0) (2023-10-02)

### Bug Fixes

- **monorepo:** drop Node 16 support ([41988da](https://github.com/homer0/packages/commit/41988da8e3f15a1c2daecfe0d7c9243eb19f9351))
- **monorepo:** update dependencies ([e36d163](https://github.com/homer0/packages/commit/e36d1630c8fc754d9359665100c8a027b15cfb9e))

### BREAKING CHANGES

- **monorepo:** Node 16 is not longer supported. Node 18 is the minimum required version now.

# [11.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.3.2...@homer0/eslint-plugin@11.0.0) (2023-07-29)

### Bug Fixes

- **eslint-plugin:** update config for Svelte ([2b4a473](https://github.com/homer0/packages/commit/2b4a47393cf7797badbc9393d236de829988a64f))

### BREAKING CHANGES

- **eslint-plugin:** The ESLint config for Svelte now requires eslint-plugin-svelte

## [10.3.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.3.1...@homer0/eslint-plugin@10.3.2) (2023-07-16)

### Bug Fixes

- **monorepo:** update all dependencies ([c3d837e](https://github.com/homer0/packages/commit/c3d837e5820d27a27e97322211478d880000c064))

## [10.3.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.3.0...@homer0/eslint-plugin@10.3.1) (2023-06-18)

**Note:** Version bump only for package @homer0/eslint-plugin

# [10.3.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.0.3...@homer0/eslint-plugin@10.3.0) (2023-06-18)

Nothing changed in this version, I just messed up the commits.

## [10.2.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.2.1...@homer0/eslint-plugin@10.2.2) (2023-06-18)

### Bug Fixes

- **eslint-plugin:** remove deprecated option from JSDoc plugin ([a0938dd](https://github.com/homer0/packages/commit/a0938ddc017c54f277ce1ea82796577ab54bacc8))
- **monorepo:** update all dependencies ([e48d13a](https://github.com/homer0/packages/commit/e48d13a474ce710f73128a49ca6ad4ac2da23ef0))

## [10.2.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.2.0...@homer0/eslint-plugin@10.2.1) (2023-03-18)

### Bug Fixes

- **eslint-plugin:** disable import/no-unresolved for ts ([56aad06](https://github.com/homer0/packages/commit/56aad0633a5decb51570d480e378735067c64ec5))

# [10.2.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.1.2...@homer0/eslint-plugin@10.2.0) (2023-03-15)

### Bug Fixes

- **eslint-plugin:** use project as an array in the preset ([3d23c53](https://github.com/homer0/packages/commit/3d23c53cb027e9dfaa54b6cc5e7e07ee7e69524d))

### Features

- **eslint-plugin:** add preset for next ([2deeff0](https://github.com/homer0/packages/commit/2deeff09d2b072bcda706baae04f9370f38f7e7e))

## [10.1.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.1.1...@homer0/eslint-plugin@10.1.2) (2023-03-15)

### Bug Fixes

- **eslint-plugin:** use project as an array in the preset ([3d23c53](https://github.com/homer0/packages/commit/3d23c53cb027e9dfaa54b6cc5e7e07ee7e69524d))

## [10.1.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.1.0...@homer0/eslint-plugin@10.1.1) (2023-03-15)

### Bug Fixes

- **eslint-plugin:** use kebab-case for the next config ([1f67dd7](https://github.com/homer0/packages/commit/1f67dd735ce317fc50214be54474bd9204711e7e))

# [10.1.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.0.3...@homer0/eslint-plugin@10.1.0) (2023-03-15)

### Bug Fixes

- **eslint-plugin:** disable missing import on ts ([920ab51](https://github.com/homer0/packages/commit/920ab5127d745d4565323b5d9e3261b974a3d020))
- **eslint-plugin:** update dependencies ([873e5c8](https://github.com/homer0/packages/commit/873e5c80cd6a98febc83a532a1977327017ce198))
- **eslint-plugin:** use ts version of the dot notation rule ([34ca9bc](https://github.com/homer0/packages/commit/34ca9bcaa3d557896238adbe1112ca829c8cddf2))
- **monorepo:** update all dependencies ([7fe0f9a](https://github.com/homer0/packages/commit/7fe0f9a39ec89e9b3fa9530e9332828916f3a108))

### Features

- **eslint-plugin:** add base config for next ([4900c7e](https://github.com/homer0/packages/commit/4900c7e9992fc508176fcc24140133eb3e1793aa))

## [10.0.3](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.0.2...@homer0/eslint-plugin@10.0.3) (2023-03-05)

### Bug Fixes

- **monorepo:** update all dependencies ([7fe0f9a](https://github.com/homer0/packages/commit/7fe0f9a39ec89e9b3fa9530e9332828916f3a108))

## [10.0.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.0.1...@homer0/eslint-plugin@10.0.2) (2023-01-28)

### Bug Fixes

- **monorepo:** update all dependencies ([7618870](https://github.com/homer0/packages/commit/7618870e6ec4d6f281a79b15f139124875c760b2))

## [10.0.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@10.0.0...@homer0/eslint-plugin@10.0.1) (2022-12-31)

### Bug Fixes

- **monorepo:** update all dependencies ([613418f](https://github.com/homer0/packages/commit/613418f3efbe3aeb595a12964ae16cf803316aa0))

# 10.0.0 (2022-12-27)

### Bug Fixes

- drop Yarn ([e41698c](https://github.com/homer0/packages/commit/e41698c310996d1ca520bd6a9a2220017e1a3d49))
- **monorepo:** drop Node 14 support ([4df5a23](https://github.com/homer0/packages/commit/4df5a23c1c3e5d1632679f4902c0c73113252bc0))
- **monorepo:** update all dependencies ([0ba6a5a](https://github.com/homer0/packages/commit/0ba6a5a68413ab557cce5a5afbd6314e42d86671))

### BREAKING CHANGES

- **monorepo:** Node 14 is not longer supported. Node 16 is the minimum required version now.

## [9.1.3](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@9.1.2...@homer0/eslint-plugin@9.1.3) (2022-10-22)

### Bug Fixes

- update dependencies ([abcf502](https://github.com/homer0/packages/commit/abcf5027fce4cb7d37d9e4cf9aafc1846c7bceb0))

## 9.1.2 (2022-07-17)

### Bug Fixes

- **eslint-plugin:** disable sort-class-members for ts ([b3dcbef](https://github.com/homer0/packages/commit/b3dcbef779af6a1e34fbb18f1fbae6cbce5f6e4e))

## 9.1.1 (2022-07-12)

### Bug Fixes

- **monorepo:** force publish unpublished tags ([ce339bc](https://github.com/homer0/packages/commit/ce339bcbffb697e7127ecc213242feb54822f775))

# 9.1.0 (2022-07-12)

### Bug Fixes

- **eslint-plugin:** disable extraneous deps for jest ([ea6134d](https://github.com/homer0/packages/commit/ea6134d2030ad6138fb6a2074b9707aca6c554e0))
- **eslint-plugin:** disable import rules for Jest ([a625815](https://github.com/homer0/packages/commit/a6258156913f704eaebb9a3d8db220950e5c0ef4))
- **eslint-plugin:** disable max-classes for jest ([36cce1a](https://github.com/homer0/packages/commit/36cce1acca419ab9c8085472871614ce767c184a))
- **eslint-plugin:** remove separation for async methods ([1ecb2e0](https://github.com/homer0/packages/commit/1ecb2e05fdc0330b9ed1978b78d5de719603bd49))
- **monorepo:** update all dependencies ([fc95b09](https://github.com/homer0/packages/commit/fc95b096bc4c2976ba5cd9c7354890137b66a3bd))

### Features

- **eslint-plugin:** add jest+node+ts config ([fde6c1d](https://github.com/homer0/packages/commit/fde6c1de64526208d10a37389d54c91ae26a5d30))
- **eslint-plugin:** add ts preset ([a9b8898](https://github.com/homer0/packages/commit/a9b8898037f4480a3fa06e1eb6eff60b722a34cd))

## [9.0.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@9.0.1...@homer0/eslint-plugin@9.0.2) (2022-04-25)

### Bug Fixes

- **eslint-plugin:** allow the use of Object ([966acc2](https://github.com/homer0/packages/commit/966acc2a748fe394ab0d475287ee02e1f9e0b6d1))
- **eslint-plugin:** move node rules out from the ts generic rules ([0c7b62e](https://github.com/homer0/packages/commit/0c7b62ee64b26a7ccfe69a341b7c186ccd4b8e01))

## [9.0.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@9.0.0...@homer0/eslint-plugin@9.0.1) (2022-03-27)

### Bug Fixes

- **eslint-plugin:** move node rules out from the ts generic rules ([0c7b62e](https://github.com/homer0/packages/commit/0c7b62ee64b26a7ccfe69a341b7c186ccd4b8e01))

# [9.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@8.0.2...@homer0/eslint-plugin@9.0.0) (2022-03-17)

### Bug Fixes

- **eslint-plugin:** add a different config for ts node ([1a50594](https://github.com/homer0/packages/commit/1a5059455241a8dc19ab9d6d29c1be2d6fc5f04a))
- **eslint-plugin:** add the recommended preset ([96ee211](https://github.com/homer0/packages/commit/96ee211fcee86b9585f2f53feedc800fe839e9bb))
- **eslint-plugin:** install missing dependencies ([989382c](https://github.com/homer0/packages/commit/989382c043dee70fecadda41e396eada08b37ed1))
- **eslint-plugin:** remove alph sort for class members ([abe489f](https://github.com/homer0/packages/commit/abe489f0365d4c9c6970164cab51050b36a2d5ca))
- **eslint-plugin:** update dependencies ([82c1f40](https://github.com/homer0/packages/commit/82c1f407e1132ef20af3ff819fc0666591271b2f))
- **monorepo:** drop Node 12 support ([7966821](https://github.com/homer0/packages/commit/79668213b982a93d5b91f1177cf404df0cd4fb3a))

### Features

- **eslint-plugin:** add React config ([645cd45](https://github.com/homer0/packages/commit/645cd45fe436f99721dd698c99681e962b5d28fb))
- **eslint-plugin:** add Svelte config ([e3f6bb2](https://github.com/homer0/packages/commit/e3f6bb2bb6255859eb5312e76f9e5ba5bbcfc210))
- **eslint-plugin:** add TypeScript configuration ([25c5fef](https://github.com/homer0/packages/commit/25c5fef348f2f9954822aa3a10835708a00dc654))

### BREAKING CHANGES

- **monorepo:** Node 12 is not longer supported. Node 14 is the minimum required version now.

## 8.0.2 (2021-10-17)

### Bug Fixes

- update dependencies ([7a56417](https://github.com/homer0/packages/commit/7a5641707d66264a6cfefcad3eb819aae6a2cee3))

## 8.0.1 (2021-08-07)

**Note:** Version bump only for package @homer0/eslint-plugin

# [8.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@7.0.0...@homer0/eslint-plugin@8.0.0) (2021-07-25)

### Bug Fixes

- **eslint-plugin:** update dependencies ([c191d8c](https://github.com/homer0/packages/commit/c191d8ccea0111037419877da8e1406fa0d5b385))

### BREAKING CHANGES

- **eslint-plugin:** Latest version of eslint-plugin-jsdoc requires Node 12.20, so
  now this plugins requires too.

# 7.0.0 (2021-04-11)

### Bug Fixes

- **monorepo:** drop support for Node 10 ([7098299](https://github.com/homer0/packages/commit/7098299172dfa94bdfb131a2dc877c0f2250b7b3))

### BREAKING CHANGES

- **monorepo:** The monorepo and the packages no longer support Node 10.

## [6.0.3](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@6.0.1...@homer0/eslint-plugin@6.0.3) (2021-03-07)

### Bug Fixes

- update dependencies ([7437e8c](https://github.com/homer0/packages/commit/7437e8c12e1d46d11f8dd8cfe793307391dbfa5f))
- **monorepo:** update dependencies ([cf78785](https://github.com/homer0/packages/commit/cf7878566344cb34b6d5f584ec11227a20fc1c53))

## [6.0.2](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@6.0.1...@homer0/eslint-plugin@6.0.2) (2021-01-25)

### Bug Fixes

- update dependencies ([7437e8c](https://github.com/homer0/packages/commit/7437e8c12e1d46d11f8dd8cfe793307391dbfa5f))

## [6.0.1](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@6.0.0...@homer0/eslint-plugin@6.0.1) (2020-11-28)

### Bug Fixes

- include publishConfig and fix the format of the repository property ([4c25780](https://github.com/homer0/packages/commit/4c25780099bd60443a3625f5ab2c62a41a5c1314))

# [6.0.0](https://github.com/homer0/packages/compare/@homer0/eslint-plugin@5.0.2...@homer0/eslint-plugin@6.0.0) (2020-11-05)

### Bug Fixes

- **eslint-plugin:** allow R.\_\_ ([6de6446](https://github.com/homer0/packages/commit/6de6446ff760c4e40a4818cd8d27bce200c43b06))
- **eslint-plugin:** disable the rule sentences on JSDoc descriptions ([ebca8be](https://github.com/homer0/packages/commit/ebca8beeff58ea95dc03dd8a1e3bf825d06537b2))
- **eslint-plugin:** disallow double quotes ([e114ae4](https://github.com/homer0/packages/commit/e114ae496484df6f2527ad0ef484069eba412cdf))
- **monorepo:** update dependencies ([cd892a8](https://github.com/homer0/packages/commit/cd892a865d8251cab3f80913a2c219c118d67e19))

### Features

- **eslint-plugin:** add variants with Prettier ([d845200](https://github.com/homer0/packages/commit/d84520063c23e20d7e18c5f39220de339691ac99))

### BREAKING CHANGES

- **eslint-plugin:** The rule that validates sentences on JSDoc descriptions was removed, and while
  it's a breaking changes as it won't validate it anymore, the rule expression is broken, as
  it gets triggered by the template tag.
- **eslint-plugin:** Before this commit, using double quotes to avoid escaping a single quote
  was allowed, but now it will trigger an error.

## 5.0.2 (2020-08-10)

### Bug Fixes

- update dependencies ([73be095](https://github.com/homer0/packages/commit/73be095484748600643e78bc11457ac5b06276ec))

## 5.0.1 (2020-07-22)

### Bug Fixes

- update dependencies ([6611bcb](https://github.com/homer0/packages/commit/6611bcb61ec3d4045501db79b41a5a17b0a8a770)), closes [#15](https://github.com/homer0/packages/issues/15)
- update dependencies ([48d664e](https://github.com/homer0/packages/commit/48d664e9eda47106c371509ff064602d51fa5379))

# 5.0.0 (2020-07-11)

### Bug Fixes

- only run release on master ([76dcb40](https://github.com/homer0/packages/commit/76dcb40127cdee6281faf1dfa0c25fd4e51e79ce))
- remove the overwrite for comma-dangle ([6c4a98e](https://github.com/homer0/packages/commit/6c4a98e07aaf3533ce4d0627db264f6f8fbf818b))
- remove the overwrite for max-classes-per-file ([2ef5130](https://github.com/homer0/packages/commit/2ef5130a6c6f8136f8e9c699abdaf266b2d9c030))
- remove the overwrite for prefer-object-spread ([f1df7c9](https://github.com/homer0/packages/commit/f1df7c9a1dbff4594db11ddb5b19b5ea34d5cdb3))
- set the preferred type to Object ([e71ae90](https://github.com/homer0/packages/commit/e71ae90ba2413d1b00656726a3d0fb986740e9ea))
- use github plugin instead of git ([27c9beb](https://github.com/homer0/packages/commit/27c9bebe0e6d370a71254c5e39fc056cf128badd))

### Features

- add JSDoc and sort-class-members ([340a540](https://github.com/homer0/packages/commit/340a5406623c97bd49871d679bf3e57f88fde447))
- add jsdoc configuration ([8caf8c3](https://github.com/homer0/packages/commit/8caf8c3f65ea9ec3a382b13a31a365c59253ad3b))
- add the sort-class-members plugin ([07354ce](https://github.com/homer0/packages/commit/07354ceab3109b4ea13b81ee8e41abfe8f676962))
- allow the use of the tag parent ([4d79c60](https://github.com/homer0/packages/commit/4d79c6005832c2033b805b75c4cbfd97907bf4ea))
- exclude 60 from no-magic-numbers ([58d9c8e](https://github.com/homer0/packages/commit/58d9c8eaecba8653bf91f50026e8012f18540150))

### BREAKING CHANGES

- All class members will now have to follow the order set by the `sort-class-members` plugin configuration.
- You'll need to stop using `Object.assign` for most of the basic cases.
- You now need to add a trailing comma to function parameters.
- You can't have more than one class per file now.
