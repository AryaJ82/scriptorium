
import { formatDistanceToNow } from "date-fns";

export function timeAgo(isoString: string) {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}
