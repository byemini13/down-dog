const POSES = {
  reclined_figure_4: "./poses/reclined_figure_4.svg",
  low_lunge: "./poses/low_lunge.svg",
  lizard: "./poses/lizard.svg",
  pigeon: "./poses/pigeon.svg",
  shoelace: "./poses/shoelace.svg",
  knee_to_chest: "./poses/knee_to_chest.svg",
  supine_twist: "./poses/supine_twist.svg",
  seated_half_fold: "./poses/seated_half_fold.svg",
  open_book: "./poses/open_book.svg",
  seated_figure_4: "./poses/seated_figure_4.svg",
  half_split: "./poses/half_split.svg",
  reclined_hamstring: "./poses/reclined_hamstring.svg",
  deep_lunge_quad: "./poses/deep_lunge_quad.svg",
  sleeping_swan: "./poses/sleeping_swan.svg",
  deer: "./poses/deer.svg",
  dragon: "./poses/dragon.svg",
  seated_side_bend: "./poses/seated_side_bend.svg",
  reclined_twist: "./poses/reclined_twist.svg",
  meditation: "./poses/meditation.svg",
};

export function poseUrl(poseId) {
  return POSES[poseId] || POSES.meditation;
}

export const POSE_URLS = Object.values(POSES);
