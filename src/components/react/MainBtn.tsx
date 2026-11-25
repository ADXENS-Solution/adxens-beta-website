import { useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

const glow = (w: number, h: number, matrix: string) =>
  `url("data:image/svg+xml;utf8,<svg viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(${matrix})'><stop stop-color='rgba(5,23,85,1)' offset='0'/><stop stop-color='rgba(15,40,127,1)' offset='0.25'/><stop stop-color='rgba(25,57,170,1)' offset='0.5'/><stop stop-color='rgba(35,74,212,1)' offset='0.75'/><stop stop-color='rgba(45,92,255,1)' offset='1'/></radialGradient></defs></svg>"), linear-gradient(90deg, rgb(217,217,217) 0%, rgb(217,217,217) 100%)`;

const ELLIPSE = `url("data:image/svg+xml;utf8,<svg width='175.6' height='175.6' viewBox='0 0 175.6 175.6' fill='none' xmlns='http://www.w3.org/2000/svg'><g filter='url(%23f)'><circle cx='87.8' cy='87.8' r='50' fill='white'/></g><defs><filter id='f' x='0' y='0' width='175.6' height='175.6' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'><feFlood flood-opacity='0' result='B'/><feBlend mode='normal' in='SourceGraphic' in2='B' result='shape'/><feGaussianBlur stdDeviation='18.9'/></filter></defs></svg>")`;

const GRADIENT = "linear-gradient(180deg, #2d5cff 0%, #1642e0 100%)";

const css = `
.mainbtn{position:relative;display:inline-flex;flex-direction:column;width:183px;--mb-t:opacity 200ms ease-out}
.mainbtn__glow{position:absolute;pointer-events:none;border-radius:8px;filter:blur(13.1px);transition:var(--mb-t)}
.mainbtn__glow--default{left:7px;top:9px;width:169px;height:32px;opacity:.42;background-image:${glow(169, 32, "-2.2009e-15 6.322 -7.8223 -1.3159e-14 84.5 19.512")}}
.mainbtn__glow--hover{left:4px;top:18.55px;width:175px;height:41px;opacity:0;background-image:${glow(175, 41, "-2.279e-15 8.1 -8.1 -1.686e-14 87.5 25")}}
.mainbtn__frame{position:relative;width:100%;padding:1px;border-radius:8px;overflow:hidden;box-sizing:border-box}
.mainbtn__layer{position:absolute;inset:0;pointer-events:none;transition:var(--mb-t)}
.mainbtn__border{background-image:${GRADIENT};opacity:0}
.mainbtn__ellipse{position:absolute;left:6.2px;top:-60.8px;width:175.6px;height:175.6px;mix-blend-mode:plus-lighter;background:${ELLIPSE} no-repeat center/100% 100%;opacity:0;pointer-events:none;transition:var(--mb-t)}
.mainbtn__link{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:48px;min-height:40px;padding:10px 24px;border-radius:7px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mainbtn__fill{border-radius:7px;background-image:${GRADIENT}}
.mainbtn__tint{border-radius:7px;background:rgba(255,255,255,.05);opacity:0}
.mainbtn__shadow{border-radius:inherit;box-shadow:inset 0 -2px 1.3px 0 rgba(0,0,0,.25),inset 0 2px .7px 0 rgba(255,255,255,.17)}
.mainbtn__label{position:relative;z-index:1;white-space:nowrap;color:#fff;font-family:var(--font-inter-face,var(--font-inter),Inter,"Inter Fallback",Inter,system-ui,sans-serif);font-size:14px;font-weight:600;line-height:normal;letter-spacing:-0.56px;text-shadow:0 1px 1px rgba(8,28,110,.55)}
.mainbtn:hover .mainbtn__glow--default{opacity:0}
.mainbtn:hover .mainbtn__glow--hover{opacity:.42}
.mainbtn:hover :is(.mainbtn__border,.mainbtn__tint){opacity:1}
.mainbtn:hover .mainbtn__ellipse{opacity:.2}
.mainbtn.is-settled:hover .mainbtn__glow--default{opacity:.42}
.mainbtn.is-settled:hover .mainbtn__glow--hover{opacity:0}
.mainbtn.is-settled:hover :is(.mainbtn__border,.mainbtn__tint){opacity:0}
.mainbtn.is-settled:hover .mainbtn__ellipse{opacity:0}
.mainbtn__link:focus-visible{outline:2px solid rgba(255,255,255,.6);outline-offset:2px}
`;

type Common = { children?: ReactNode; className?: string };
type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
export type MainBtnProps = AsLink | AsButton;

export default function MainBtn({ children = "Request Early Access", className, onClick, ...rest }: MainBtnProps) {
  const [suppressHover, setSuppressHover] = useState(false);
  const rootClass = ["mainbtn", suppressHover ? "is-settled" : "", className].filter(Boolean).join(" ");

  const handleClick = (event: MouseEvent<HTMLAnchorElement & HTMLButtonElement>) => {
    setSuppressHover(true);
    onClick?.(event);
  };
  const inner = (
    <>
      <span className="mainbtn__layer mainbtn__fill" aria-hidden />
      <span className="mainbtn__layer mainbtn__tint" aria-hidden />
      <span className="mainbtn__ellipse" aria-hidden />
      <span className="mainbtn__label">{children}</span>
      <span className="mainbtn__layer mainbtn__shadow" aria-hidden />
    </>
  );

  return (
    <div className={rootClass} onPointerLeave={() => setSuppressHover(false)}>
      <style href="mainbtn-hover" precedence="default">{css}</style>
      <span className="mainbtn__glow mainbtn__glow--default" aria-hidden />
      <span className="mainbtn__glow mainbtn__glow--hover" aria-hidden />
      <div className="mainbtn__frame">
        <span className="mainbtn__layer mainbtn__border" aria-hidden />
        {"href" in rest && rest.href !== undefined ? (
          <a className="mainbtn__link" {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} onClick={handleClick}>{inner}</a>
        ) : (
          <button type="button" className="mainbtn__link" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} onClick={handleClick}>{inner}</button>
        )}
      </div>
    </div>
  );
}
