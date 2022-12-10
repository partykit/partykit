export default function uniqueId() {
  return Math.random().toString(36).substring(2, 9);
}
