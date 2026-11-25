// Titles describe places in the village. Sealed assignments stay in the original calendar.
const locales = {
  en: {
    brand: 'North Pole', club: 'Inventor Club', village: 'The village', story: 'The story', rules: 'Golden Rules',
    edition: 'The 2026 advent calendar', heading: ['Santa’s Secret', 'Missions'], intro: 'Twelve tiny doors. Twelve secret missions. A little imagination could save Christmas.',
    explore: 'Explore the village', meet: 'Meet Santa', muted: 'Turn sound on', audible: 'Mute sound', menu: 'Village menu',
    route: 'Village route', location: 'Current stop', drag: 'Drag to explore', progress: 'missions complete',
    prev: 'Previous stop', next: 'Next stop', guide: 'Village guide', install: 'Install & offline help', classic: 'Classic calendar',
    guideText: 'Follow the path in either direction. Drag the scenery, scroll, or use the left and right arrow keys. Choose a numbered stop below to go straight to its door.',
    guideDate: 'A new door opens every other day from December 1 to 23. Select a door to find its opening date or read its mission.',
    close: 'Close', open: 'Open the door', try: 'Try the door', mission: 'Mission', date: 'Opens', completed: 'Mission completed', ready: 'The door is open', test: 'Owner test', leaveTest: 'Return to real calendar',
    names: ['Welcome Square','Gingerbread Cottage','Winter Forest','Frostglass Hall','Christmas Bakery','Elf Workshop','Lantern Market','Aurora Cabin','Snowman Cottage','Reindeer Lodge','Candy Shop','Star Observatory','Christmas Palace'],
    sub: ['','Follow the sugared roofline to a little door tucked under the icing.','A trail of folded pines leads to a quiet woodland hideaway.','Look for a golden glow on the other side of the frozen pond.','The oven is warm. Something secret is rising beneath the eaves.','Ribbon curls and tiny toys gather outside the elves’ workroom.','Follow the lanterns to the last stall in the Christmas market.','Beneath ribbons of northern light, one window still glows.','A snowman keeps watch over this little powder-blue cottage.','The reindeer have left fresh tracks by the timber lodge.','A peppermint-striped doorway waits behind the sweets.','Under a golden dome, the village keeps watch on the stars.','The circular path leads to one last door, trimmed in gold.']
  },
  da: {
    brand:'Nordpolens',club:'Opfinderklub',village:'Landsbyen',story:'Historien',rules:'Gyldne regler',
    edition:'Julekalenderen 2026',heading:['Julemandens','hemmelige missioner'],intro:'Tolv små døre. Tolv hemmelige missioner. Lidt fantasi kan redde julen.',
    explore:'Udforsk landsbyen',meet:'Mød julemanden',muted:'Slå lyden til',audible:'Slå lyden fra',menu:'Landsbymenu',
    route:'Landsbyruten',location:'Dit stop',drag:'Træk for at udforske',progress:'missioner fuldført',
    prev:'Forrige stop',next:'Næste stop',guide:'Landsbyguide',install:'Installation og offlinehjælp',classic:'Klassisk kalender',
    guideText:'Følg stien i begge retninger. Træk i landskabet, rul, eller brug piletasterne. Vælg et nummer på ruten for at gå direkte til en dør.',
    guideDate:'En ny dør åbner hver anden dag fra 1. til 23. december. Vælg en dør for at se datoen eller læse missionen.',
    close:'Luk',open:'Åbn døren',try:'Prøv døren',mission:'Mission',date:'Åbner',completed:'Mission fuldført',ready:'Døren er åben',test:'Ejertest',leaveTest:'Tilbage til den rigtige kalender',
    names:['Velkomstpladsen','Peberkagehuset','Vinterskoven','Frostsalen','Julebageriet','Nissernes værksted','Lygtemarkedet','Nordlyshytten','Snemandshuset','Rensdyrhytten','Slikbutikken','Stjerneobservatoriet','Julepaladset'],
    sub:['','Følg sukkertaget til en lille dør under glasuren.','En sti af foldede graner fører til et roligt skjul i skoven.','Se efter et gyldent skær på den anden side af den frosne dam.','Ovnen er varm. En hemmelighed hæver under taget.','Gavebånd og legetøj venter uden for nissernes værksted.','Følg lygterne til den sidste bod på julemarkedet.','Under nordlysets bånd lyser et enkelt vindue.','En snemand holder vagt ved det lyseblå hus.','Rensdyrene har sat friske spor ved bjælkehytten.','En pebermyntestribet dør gemmer sig bag slikket.','Under en gylden kuppel holder landsbyen øje med stjernerne.','Den runde sti fører til en sidste dør pyntet med guld.']
  },
  sv: {
    brand:'Nordpolens',club:'Uppfinnarklubb',village:'Byn',story:'Berättelsen',rules:'Gyllene regler',
    edition:'Adventskalendern 2026',heading:['Tomtens hemliga','uppdrag'],intro:'Tolv små dörrar. Tolv hemliga uppdrag. Lite fantasi kan rädda julen.',
    explore:'Utforska byn',meet:'Träffa tomten',muted:'Slå på ljudet',audible:'Stäng av ljudet',menu:'Bymeny',
    route:'Byrundan',location:'Du är här',drag:'Dra för att utforska',progress:'uppdrag klara',
    prev:'Föregående stopp',next:'Nästa stopp',guide:'Byguide',install:'Installation och offlinehjälp',classic:'Klassisk kalender',
    guideText:'Följ stigen åt båda håll. Dra i landskapet, skrolla eller använd piltangenterna. Välj ett nummer på rutten för att gå direkt till en dörr.',
    guideDate:'En ny dörr öppnas varannan dag från 1 till 23 december. Välj en dörr för att se datumet eller läsa uppdraget.',
    close:'Stäng',open:'Öppna dörren',try:'Prova dörren',mission:'Uppdrag',date:'Öppnas',completed:'Uppdraget klart',ready:'Dörren är öppen',test:'Ägartest',leaveTest:'Tillbaka till den riktiga kalendern',
    names:['Välkomsttorget','Pepparkakshuset','Vinterskogen','Frostsalen','Julbageriet','Tomteverkstaden','Lyktmarknaden','Norrskensstugan','Snögubbestugan','Renstugan','Godisbutiken','Stjärnobservatoriet','Julslottet'],
    sub:['','Följ sockertaket till en liten dörr under glasyren.','En stig av vikta granar leder till ett stilla gömställe i skogen.','Leta efter ett gyllene sken på andra sidan den frusna dammen.','Ugnen är varm. En hemlighet jäser under taket.','Presentsnören och små leksaker väntar utanför verkstaden.','Följ lyktorna till den sista boden på julmarknaden.','Under norrskenets band lyser fortfarande ett fönster.','En snögubbe vakar över det lilla ljusblå huset.','Renarna har lämnat färska spår vid timmerstugan.','En polkagrisrandig dörr väntar bakom godsakerna.','Under en gyllene kupol håller byn utkik efter stjärnorna.','Den runda stigen leder till en sista dörr kantad med guld.']
  }
};
export function getCopy(lang) { return locales[lang] || locales.en; }
