// All the words in the game. Each speaker maps to a frame in the character sheet for their portrait.

export type Who = 'Narrator' | 'Wren' | 'Oren' | 'Pip' | 'Moth' | 'Brann';
export interface Line { who: Who; text: string }

export const PORTRAIT: Record<Who, number | null> = {
  Narrator: null, Wren: 6, Oren: 2, Pip: 0, Moth: 4, Brann: 9,
};
export const NAME_COLOR: Record<Who, string> = {
  Narrator: '#9db8ff', Wren: '#ffd27a', Oren: '#8fd8ff', Pip: '#9de08a', Moth: '#ff9ac0', Brann: '#f0c8a0',
};

/** Plays when you press Begin on the title screen. */
export const PROLOGUE: Line[] = [
  { who: 'Narrator', text: 'Emberfall sits at the foot of Mount Hollow. Every winter, its lamplighters climb the mountain and light the lanterns, and the Great Hearth at the summit keeps the whole valley warm.' },
  { who: 'Narrator', text: 'This year the frost came early. The Hearth went out. One by one, the lanterns went dark.' },
  { who: 'Oren', text: 'Wren. You are the last apprentice I have left, and the only one light enough to cross the ice.' },
  { who: 'Wren', text: 'I am not afraid of the cold.' },
  { who: 'Oren', text: 'You should be. It is the one thing that can beat us. But you carry a spark, and a spark can be given away. Light every lantern on the way up.' },
  { who: 'Wren', text: 'And at the top?' },
  { who: 'Oren', text: 'At the top, the Hearth. Go on. Stay warm.' },
];

export const CHAPTER_INTRO: Line[][] = [
  [{ who: 'Narrator', text: 'Chapter one. The Orchard Path. The apple trees stand frozen mid-autumn, leaves still falling.' }],
  [
    { who: 'Narrator', text: 'Chapter two. The Cold Road. Above the orchard the wind has nothing to stop it.' },
    { who: 'Oren', text: 'Wren, can you hear me? Stay close to the lanterns. The wind steals warmth faster than you can spend it.' },
  ],
  [
    { who: 'Narrator', text: 'Chapter three. The Hearth Rise. Snow to the knees, stars to the horizon. The summit is near.' },
    { who: 'Wren', text: 'Almost there. I can feel the cold getting braver.' },
  ],
];

export const CHAPTER_OUTRO: Line[][] = [
  [
    { who: 'Narrator', text: 'Three lanterns glow behind her. Far below, a window in Emberfall lights up. Someone is watching.' },
    { who: 'Wren', text: 'Keep watching. I am coming.' },
  ],
  [
    { who: 'Narrator', text: 'Seven lanterns burn along the road now. The wind drops. Ahead lies the snowline, and the long climb.' },
    { who: 'Wren', text: 'Over halfway.' },
  ],
  [
    { who: 'Narrator', text: 'At the summit the Great Hearth sat cold and grey, as tall as a house.' },
    { who: 'Wren', text: 'I carried every spark I had. It is not enough to light you, is it?' },
    { who: 'Narrator', text: 'So she gave it the last one, her own.' },
    { who: 'Narrator', text: 'The Hearth caught. Light ran down the mountain, lantern to lantern, all the way to Emberfall.' },
    { who: 'Oren', text: 'I see them! I see them all! Every window, every lantern!' },
    { who: 'Brann', text: 'The Hearth does not need fire, you know. It needs everyone\'s light, carried up together.' },
    { who: 'Wren', text: 'Then it is a good thing we lit the whole road.' },
    { who: 'Brann', text: 'That will hold till spring.' },
  ],
];

/** Short scenes where you meet someone on the road. They also hand you something warm. */
export const NPC_SCENES: Record<string, Line[]> = {
  pip: [
    { who: 'Pip', text: 'Wren! The orchard lantern has been dark since the first frost. All the apples froze on the branch.' },
    { who: 'Pip', text: 'Take this. Cider. It is still warm.' },
    { who: 'Wren', text: 'Thank you, Pip. I will light it on my way up.' },
  ],
  moth: [
    { who: 'Moth', text: 'Careful up here. The shadows are not just shadows. They are the cold, wearing a coat.' },
    { who: 'Wren', text: 'Then I will give them something warmer to look at.' },
    { who: 'Moth', text: 'Brave. Here, a hot stone for your pocket.' },
  ],
  brann: [
    { who: 'Brann', text: 'I kept the Hearth for forty winters. When it went out, my knees would not carry me up.' },
    { who: 'Brann', text: 'Take my scarf. It has been to the top more times than I have.' },
    { who: 'Wren', text: 'I will bring it back. And the light.' },
  ],
};

export const THANKS = 'Thank you for playing.';
