export default function AnnouncementBar({ messages = [] }) {
  if (!messages.length) return null;
  return (
    <div className="on-dark bg-black text-white">
      <div className="container-site flex h-9 items-center justify-center gap-10 text-[13px] font-medium">
        <p className="truncate">{messages[0]}</p>
        {messages[1] && <p className="hidden truncate text-lime md:block">{messages[1]}</p>}
      </div>
    </div>
  );
}
