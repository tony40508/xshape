# xshape

[![npm version](https://badge.fury.io/js/xshape.svg)](https://badge.fury.io/js/xshape.svg)
[![npm download](https://img.shields.io/npm/dm/xshape.svg?style=flat-square)](https://www.npmjs.com/package/xshape)

## Install

```bash
npm install xshape
```

## Usage

```js
import { useXShape, XShapeStage, URLImage } from 'xshape';

const {
  componentProps,
  // other props see https://github.com/tony40508/xshape/blob/main/src/App.tsx
} = useXShape();
...
<XShapeStage
  {...componentProps}
  // enable to configure finish condition in limited options, see https://github.com/tony40508/xshape/blob/main/src/utils/types.d.ts
  handleMouseDown={(e) => {
    componentProps.handleMouseDown(e, 'ctrl+click');
  }}
>
  <URLImage url="url-resource" />
</XShapeStage>;
```

## Run the example locally

```bash
npm install
npm run dev
```
