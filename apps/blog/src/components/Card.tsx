import Datetime from "./Datetime";
import type { BlogFrontmatter } from "@content/_schemas";

export interface Props {
  href?: string;
  frontmatter: BlogFrontmatter;
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, description } = frontmatter;
  return (
    <li className="card">
      <a href={href} className="font-L">
        {secHeading ? (
          <h2 className="">{title}</h2>
        ) : (
          <h3 className="">{title}</h3>
        )}
      </a>
      <Datetime datetime={pubDatetime} />
      <p>{description}</p>
    </li>
  );
}
