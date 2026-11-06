import { createCn } from "cn/config";

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "2xs",
            "label",
            "code",
            "title",
            "heading",
            "auth",
            "hero",
            "stat",
            "stat-lg",
          ],
        },
      ],
    },
  },
});
