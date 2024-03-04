import SplitPane from './SplitPane';
import { Editor } from './Editor/Editor';
import { Navigation } from './Navigation';
import { Navigationv3 } from './Navigationv3';
import { Template } from './Template';
import { VisualiserTemplate } from './Visualiser';

import { debounce } from '../helpers';
import { usePanelsState, useDocumentsState } from '../state';

// import type { FunctionComponent } from 'react';
import { FunctionComponent, useEffect, useState } from 'react';
import * as yaml from 'js-yaml'
import { useFilesState } from '../state';

declare const require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
};
const context = require.context('../../public/serviceDomainSchemaControlRecordYAMLISOSandbox', false, /\.yaml$/);

interface ContentProps {}

export const Content: FunctionComponent<ContentProps> = () => { // eslint-disable-line sonarjs/cognitive-complexity
  const { show, secondaryPanelType } = usePanelsState();
  const document = useDocumentsState(state => state.documents['asyncapi']?.document) || null;
  const isV3 = document?.version() === '3.0.0';
  const navigationEnabled = show.primarySidebar;
  const editorEnabled = show.primaryPanel;
  const viewEnabled = show.secondaryPanel;
  const viewType = secondaryPanelType;

  const splitPosLeft = 'splitPos:left';
  const splitPosRight = 'splitPos:right';

  const localStorageLeftPaneSize = parseInt(localStorage.getItem(splitPosLeft) || '0', 10) || 220;
  const localStorageRightPaneSize = parseInt(localStorage.getItem(splitPosRight) || '0', 10) || '55%';

  const secondPaneSize = navigationEnabled && !editorEnabled ? localStorageLeftPaneSize : localStorageRightPaneSize;
  const secondPaneMaxSize = navigationEnabled && !editorEnabled ? 360 : '100%';

  const navigationAndEditor = (
    <SplitPane
      minSize={220}
      maxSize={360}
      pane1Style={navigationEnabled ? { overflow: 'auto' } : { width: '0px' }}
      pane2Style={editorEnabled ? undefined : { width: '0px' }}
      primary={editorEnabled ? 'first' : 'second'}
      defaultSize={localStorageLeftPaneSize}
      onChange={debounce((size: string) => {
        localStorage.setItem(splitPosLeft, String(size));
      }, 100)}
    >
      {
        isV3 ? <Navigationv3 /> : <Navigation />
      }
      <Editor />
    </SplitPane>
  );

  const { updateFile } = useFilesState((state) => state);

  useEffect(() => {
    const fileName = location.pathname.split('/').pop();
    const fileNames = context.keys();

    if (fileNames?.includes(`./${fileName}.yaml`)) {
      const filePath = `./../serviceDomainSchemaControlRecordYAMLISOSandbox/${fileName}.yaml`;

      fetch(filePath)
        .then((response) => {
          if (!response.ok) {
            console.error(`File ${fileName} not found`);
          }
          return response.text();
        })
        .then((data) => {
           updateFile('asyncapi', { content: data, modified: true, language: 'yaml', stat: { mtime: (new Date()).getTime()} });
        })
        .catch((error) => console.error(error));
    } else {
      console.error("File not exists");
    }
  }, [updateFile]);

  return (
    <div className="flex flex-1 flex-row relative">
      <div className="flex flex-1 flex-row relative">
        <SplitPane
          size={viewEnabled ? secondPaneSize : 0}
          minSize={0}
          maxSize={secondPaneMaxSize}
          pane1Style={
            navigationEnabled || editorEnabled ? undefined : { width: '0px' }
          }
          pane2Style={
            viewEnabled ? { overflow: 'auto' } : { width: '0px' }
          }
          primary={viewEnabled ? 'first' : 'second'}
          defaultSize={localStorageRightPaneSize}
          onChange={debounce((size: string) => {
            localStorage.setItem(splitPosRight, String(size));
          }, 100)}
        >
          {navigationAndEditor}
          {viewType === 'template' && <Template />}
          {viewType === 'visualiser' && <VisualiserTemplate />}
        </SplitPane> 
      </div>
    </div>
  );
};