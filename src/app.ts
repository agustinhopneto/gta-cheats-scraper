import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

type Cheats = {
  name: string;
  cheats: {
    pc: string[];
    xbox: string[];
    ps: string[];
  };
}

type AssignCheatDTO = {
  name: string;
  cheatCode: string[];
  cheatsArray: Cheats[];
  cheatIndex: number;
  platform: 'pc' | 'ps' | 'xbox';
}

const xboxButtons = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'X', 'Y', 'B', 'RB', 'RT', 'RS', 'LB', 'LT', 'LS'];

const url = "https://charlieintel.com/all-gta-san-andreas-cheat-codes-on-pc-xbox-playstation/147528/";

const assignCheat = ({
  name,
  cheatCode,
  cheatsArray,
  cheatIndex,
  platform,
}: AssignCheatDTO): void => {
  const cheat: Cheats = {
    name: '',
    cheats: {
      pc: [],
      ps: [],
      xbox: [],
    }
  }

  if (cheatIndex < 0) {
    Object.assign(cheat, {
      name,
      cheats: {
        [platform]: cheatCode,
      },
    });

    cheatsArray.push(cheat);

    return;
  };

  if (!cheatsArray[cheatIndex].cheats[platform]) {
    Object.assign(cheatsArray[cheatIndex].cheats, {
      [platform]: cheatCode,
    });
  }
};

const scrapeData = async () => {
  try {
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    const listItems = $('figure table tbody tr');

    const cheats: Cheats[] = [];

    listItems.each((_, el) => {
      const name = $(el).children('td').first().text();
      const cheatCode = $(el).children('td').last().text().toUpperCase().replace(/\s/g, '');

      const index = cheats.findIndex((item) => item.name === name);
      
      if (cheatCode.split(',').length <= 1) {
        assignCheat({
          name,
          cheatCode: cheatCode.split(''),
          cheatIndex: index,
          cheatsArray: cheats,
          platform: 'pc',
        });

        return;
      };

      const cheatCodeArray = cheatCode.split(',');
      
      const buttonsMatchXbox = cheatCodeArray.map(item => xboxButtons.includes(item)).filter(Boolean);

      if (!(buttonsMatchXbox.length === cheatCodeArray.length)) {
        assignCheat({
          name,
          cheatCode: cheatCode.split(','),
          cheatIndex: index,
          cheatsArray: cheats,
          platform: 'ps',
        });

        return;
      }

      assignCheat({
        name,
        cheatCode: cheatCode.split(','),
        cheatIndex: index,
        cheatsArray: cheats,
        platform: 'xbox',
      });
    });
    
    fs.writeFile('cheats.json', JSON.stringify(cheats, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log("Successfully written data to file");
    });
  } catch (err) {
    console.error(err);
  }
};

scrapeData();