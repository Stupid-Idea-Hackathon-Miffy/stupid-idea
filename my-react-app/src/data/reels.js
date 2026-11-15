// Swap `video` for a real file/URL (e.g. "/dog.mp4") to play actual footage.
// `instaStyle: true` draws the Instagram-style overlay (pfp from `avatarImg`, Follow, audio line).
// The Instagram reels' videos and pfps are saved in public/ from instagram.com/reel/<shortcode>
// (shortcodes in the comments below).
// Keep ids stable: they are stored in Supabase (likes, profile reels, messages).
export const reels = [
    { id: 4, emoji: "🐐", avatar: "🐐", handle: "@crawly_goat", totalLikes: "110K", caption: "pov: ur a bat in the rainforest at night and ur sigma echolocation is cooking 🦇🦇🦇 no thoughts just flap. skibidi screech in ohio fr fr 😭 #batcore #rizz #brainrot #fyp", audio: "crawly_goat · Original audio", likes: 110200, score: 90, video: "/crawly-goat.mp4", avatarImg: "/crawly-goat-avatar.jpg", instaStyle: true }, // Dfw7bmdMvQ1
    { id: 5, emoji: "🐔", avatar: "🐐", handle: "@kcload_thetv", totalLikes: "17K", caption: "I Tried Acting Like A Chicken For A Day 😂", audio: "kcload_thetv · Original audio", likes: 16953, score: 85, video: "/kcload.mp4", avatarImg: "/kcload-avatar.jpg", instaStyle: true }, // DcJzGC5BdTo
    { id: 6, emoji: "😬", avatar: "🗽", handle: "@freedom.maxxer", totalLikes: "109K", caption: "Top 10 WORST situations EVER\nPls follow for more!", audio: "freedom.maxxer · Original audio", likes: 109232, score: 87, video: "/freedom-maxxer.mp4", avatarImg: "/freedom-maxxer-avatar.jpg", instaStyle: true }, // DfjkEVzswoL
    { id: 7, emoji: "🤣", avatar: "😂", handle: "@zaideimaj", totalLikes: "204K", caption: "🤣😂😂😂", audio: "zaideimaj · Original audio", likes: 204548, score: 93, video: "/zaideimaj.mp4", avatarImg: "/zaideimaj-avatar.jpg", instaStyle: true }, // DcvBqhsu5qW
    { id: 8, emoji: "🏥", avatar: "💀", handle: "@wasted", totalLikes: "19K", caption: "🤣 A hospital is a specialized healthcare institution designed to diagnose, treat, and care for people who are ill, injured, or in need of ongoing medical attention.", audio: "wasted · Original audio", likes: 19276, score: 82, video: "/wasted.mp4", avatarImg: "/wasted-avatar.jpg", instaStyle: true }, // DfxXmVzBzy0
    { id: 9, emoji: "🐈‍⬛", avatar: "🌸", handle: "@wind_hush", totalLikes: "156K", caption: "Who would you drift under the blossoms with?\n\n#minecraft #minecraftcat #cherryblossom #cozyvibes #blender", audio: "wind_hush · Original audio", likes: 155756, score: 89, video: "/wind-hush.mp4", avatarImg: "/wind-hush-avatar.jpg", instaStyle: true }, // DfvCxVnRNaw
    { id: 10, emoji: "🛋️", avatar: "🧘", handle: "@notreallywellness", totalLikes: "111K", caption: "Nothing is hard. I ran a 5K underneath my couch.", audio: "chynnajulie · alysa liu mindset", likes: 110688, score: 86, video: "/notreallywellness.mp4", avatarImg: "/notreallywellness-avatar.jpg", instaStyle: true }, // Ddr_aBro0f2
  ];
  
  export const formatCount = (n) =>
    n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, "") + "k" : String(n);