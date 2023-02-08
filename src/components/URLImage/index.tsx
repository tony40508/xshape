import { FC } from 'react';
import useImage from 'use-image';
import { Image } from 'react-konva';
import type { ImageConfig } from 'konva/lib/shapes/Image';

type ImageConfigWithoutImage = Partial<ImageConfig> & { image?: undefined };

type Props = {
  url: string;
} & ImageConfigWithoutImage;

const URLImage: FC<Props> = ({ url, ...props }) => {
  const [image] = useImage(url);
  return <Image {...props} image={image} />;
};

export { URLImage };
