import { Link } from 'react-router-dom';
import { APP_NAME } from '../config/brand';

interface Props {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  asLink?: boolean;
}

export default function BrandLogo({
  className = 'flex items-center gap-3 group',
  iconClassName = 'w-11 h-11',
  textClassName = 'brand-wordmark text-[1.7rem] md:text-[1.9rem]',
  asLink = true,
}: Props) {
  const content = (
    <>
      <img
        src="/logo.svg"
        alt=""
        className={`shrink-0 rounded-lg transition-transform duration-300 group-hover:scale-105 ${iconClassName}`}
        aria-hidden
      />
      <span className={textClassName} aria-hidden>
        <span className="brand-wordmark-bm">BM</span>
        <span className="brand-wordmark-auto">auto</span>
      </span>
    </>
  );

  if (!asLink) {
    return (
      <div className={className} aria-label={APP_NAME}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/"
      className={`${className} transition-opacity hover:opacity-95`}
      aria-label={`${APP_NAME} home`}
    >
      {content}
    </Link>
  );
}
