export const aiModels = [
  { feature: 'Background Removal', model: 'U2Net', color: 'from-neon-cyan to-neon-violet' },
  { feature: 'Clothes Change', model: 'Stable Diffusion', color: 'from-neon-purple to-neon-pink' },
  { feature: 'Animation', model: 'AnimateDiff', color: 'from-neon-pink to-neon-cyan' },
  { feature: 'Face Swap', model: 'InsightFace', color: 'from-neon-violet to-neon-purple' },
  { feature: 'Gesture Detection', model: 'MediaPipe', color: 'from-neon-cyan to-neon-pink' },
  { feature: 'Anime Filter', model: 'AnimeGAN', color: 'from-neon-purple to-neon-cyan' },
  { feature: 'Talking Face', model: 'SadTalker', color: 'from-neon-pink to-neon-violet' },
];

export const techStack = {
  Frontend: ['React.js', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Three.js'],
  Backend: ['Node.js', 'Express.js', 'Python AI Services'],
  Database: ['MongoDB'],
  'Cloud Storage': ['Cloudinary', 'AWS S3'],
};

export const supportedMedia = {
  Photos: ['JPG', 'PNG', 'WEBP', 'HEIC'],
  Videos: ['MP4', 'MOV', 'WEBM'],
  '3D Avatars': ['GLB', 'FBX'],
};
