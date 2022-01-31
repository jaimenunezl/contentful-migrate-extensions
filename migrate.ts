import * as cli from 'contentful-extension-cli';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';

interface ExtensionType {
  type: string;
}

interface Extension {
  src: string;
  srcdoc: string;
  name: string;
  sidebar: boolean;
  fieldTypes: ExtensionType[];
}

interface Item {
  extension: Extension;
}

interface ItemList {
  items: Item[];
}

const accessToken = '<PERSONAL_TOKEN>';
const spaceIdSource = '<SPACE_ID>';
const spaceIdTarget = '<SPACE_ID>';
const environment = '<ENV>';

const logsDir = join(__dirname, './logs');
const htmlDir = join(__dirname, './htmlTemp');
const suffix = new Date().toISOString().replace(/[-:.]/g, '');

(async () => {
  const clientSource = cli.createClient({
    accessToken,
    spaceId: spaceIdSource,
  });

  const clientTarjet = cli.createClient({
    accessToken,
    spaceId: spaceIdTarget,
  });

  // TODO: Get all extensions from specific environment
  const resultSource: ItemList = await clientSource.getAll();
  const resultTarget: ItemList = await clientTarjet.getAll();

  writeFileSync(
    join(logsDir, `./extension-list-source-${suffix}.json`),
    JSON.stringify(resultSource)
  );

  writeFileSync(
    join(logsDir, `./extension-list-target-${suffix}.json`),
    JSON.stringify(resultTarget)
  );

  // TODO: add filter for remove duplicate extensions
  const extensionFiltered = resultSource.items.map((e: Item) => e.extension);

  writeFileSync(
    join(logsDir, `./extension-filtered-${suffix}.json`),
    JSON.stringify(extensionFiltered)
  );

  extensionFiltered.forEach((extension: Extension, index: number) => {
    const config = {
      ...extension,
      fieldTypes: extension.fieldTypes.map((e: ExtensionType) => e.type),
    };

    const fieldTypes = config.fieldTypes
      .map((type: string) => `--field-types ${type}`)
      .join(' ');

    let src = '';
    let fileTemp = '';
    if (config.srcdoc) {
      fileTemp = join(htmlDir, `./html-${index}.html`);
      writeFileSync(fileTemp, config.srcdoc);
      src = `--srcdoc ${fileTemp}`;
    } else {
      src = `--src "${config.src}"`;
    }

    const cmd = `contentful extension create --mt ${accessToken} --space-id ${spaceIdTarget} --environment-id ${environment} ${fieldTypes} ${src} --name "${config.name}"`;

    exec(cmd, (err: any, stdout: any, stderr: any) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
      console.log(stderr);
    });
  });
})();
