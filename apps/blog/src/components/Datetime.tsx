import { LOCALE } from "@config";

export interface Props {
  datetime: string | Date;
  size?: "sm" | "lg";
  className?: string;
}

export default function Datetime({ datetime }: Props) {
  return (
    <div>
      <span className="sr-only">Posted on:</span>
      <span>
        <FormattedDatetime datetime={datetime} />
      </span>
    </div>
  );
}

const FormattedDatetime = ({ datetime }: { datetime: string | Date }) => {
  const myDatetime = new Date(datetime);

  const date = myDatetime.toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // const time = myDatetime.toLocaleTimeString(LOCALE, {
  //   hour: "2-digit",
  //   minute: "2-digit",
  // });

  return <>{date}</>;
};
