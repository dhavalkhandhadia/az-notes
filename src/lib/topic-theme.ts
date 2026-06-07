type TopicTheme = {
  badgeClassName: string;
  surfaceClassName: string;
  softBorderClassName: string;
  dotClassName: string;
  iconClassName: string;
};

const palettes: TopicTheme[] = [
  {
    badgeClassName: "bg-[#eef4ff] text-[#3466d6]",
    surfaceClassName: "border-[#dce9ff] bg-[#f7fbff]",
    softBorderClassName: "border-[#dce9ff]",
    dotClassName: "bg-[#5f8ef7]",
    iconClassName: "text-[#3466d6]",
  },
  {
    badgeClassName: "bg-[#eefbf7] text-[#1f8a68]",
    surfaceClassName: "border-[#d8f3e9] bg-[#f7fffb]",
    softBorderClassName: "border-[#d8f3e9]",
    dotClassName: "bg-[#39ba8a]",
    iconClassName: "text-[#1f8a68]",
  },
  {
    badgeClassName: "bg-[#fff4ea] text-[#c9702d]",
    surfaceClassName: "border-[#ffe4cb] bg-[#fffaf4]",
    softBorderClassName: "border-[#ffe4cb]",
    dotClassName: "bg-[#f49a57]",
    iconClassName: "text-[#c9702d]",
  },
  {
    badgeClassName: "bg-[#f5f1ff] text-[#7550d6]",
    surfaceClassName: "border-[#e7ddff] bg-[#fbf9ff]",
    softBorderClassName: "border-[#e7ddff]",
    dotClassName: "bg-[#9574ec]",
    iconClassName: "text-[#7550d6]",
  },
  {
    badgeClassName: "bg-[#fff1f6] text-[#ca5d8d]",
    surfaceClassName: "border-[#ffddeb] bg-[#fff9fc]",
    softBorderClassName: "border-[#ffddeb]",
    dotClassName: "bg-[#ef84b0]",
    iconClassName: "text-[#ca5d8d]",
  },
  {
    badgeClassName: "bg-[#f0f7ef] text-[#5c8a49]",
    surfaceClassName: "border-[#deedd9] bg-[#fbfffa]",
    softBorderClassName: "border-[#deedd9]",
    dotClassName: "bg-[#84b76d]",
    iconClassName: "text-[#5c8a49]",
  },
  {
    badgeClassName: "bg-[#eef8fb] text-[#2f7f9a]",
    surfaceClassName: "border-[#d8edf4] bg-[#f9feff]",
    softBorderClassName: "border-[#d8edf4]",
    dotClassName: "bg-[#5fb5d1]",
    iconClassName: "text-[#2f7f9a]",
  },
  {
    badgeClassName: "bg-[#fff6ee] text-[#a86a3f]",
    surfaceClassName: "border-[#f4e0cd] bg-[#fffdfa]",
    softBorderClassName: "border-[#f4e0cd]",
    dotClassName: "bg-[#d19767]",
    iconClassName: "text-[#a86a3f]",
  },
];

function hashTopic(topic: string) {
  return Array.from(topic).reduce(
    (value, character) => value + character.charCodeAt(0),
    0
  );
}

export function getTopicTheme(topic: string) {
  return palettes[hashTopic(topic) % palettes.length];
}
