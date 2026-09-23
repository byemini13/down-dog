const POSES = {
  reclined_figure_4: "./poses/reclined_figure_4.webp",
  low_lunge: "./poses/low_lunge.webp",
  lizard: "./poses/lizard.webp",
  pigeon: "./poses/pigeon.webp",
  shoelace: "./poses/shoelace.webp",
  knee_to_chest: "./poses/knee_to_chest.webp",
  supine_twist: "./poses/supine_twist.webp",
  seated_half_fold: "./poses/seated_half_fold.webp",
  open_book: "./poses/open_book.webp",
  seated_figure_4: "./poses/seated_figure_4.webp",
  half_split: "./poses/half_split.webp",
  reclined_hamstring: "./poses/reclined_hamstring.webp",
  deep_lunge_quad: "./poses/deep_lunge_quad.webp",
  sleeping_swan: "./poses/sleeping_swan.webp",
  deer: "./poses/deer.webp",
  dragon: "./poses/dragon.webp",
  seated_side_bend: "./poses/seated_side_bend.webp",
  reclined_twist: "./poses/reclined_twist.webp",
  meditation: "./poses/meditation.webp",
};

export function poseUrl(poseId) {
  return POSES[poseId] || POSES.meditation;
}

export const POSE_URLS = Object.values(POSES);
