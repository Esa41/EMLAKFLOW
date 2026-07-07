export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("emlakflow-theme");if(t==="dark"){document.documentElement.setAttribute("data-app-theme","dark");document.documentElement.style.colorScheme="dark"}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
