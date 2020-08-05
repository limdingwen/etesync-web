// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import * as Etebase from "etebase";

import { useCredentials } from "../credentials";
import { useCollections, getCollectionManager } from "../etebase-helpers";
import { routeResolver } from "../App";
import LoadingIndicator from "../widgets/LoadingIndicator";

import { CachedCollection, getDecryptCollectionsFunction, PimFab } from "../Pim/helpers";
import CollectionList from "./CollectionList";
import PageNotFound from "../PageNotFound";
import CollectionEdit from "./CollectionEdit";
import Collection from "./Collection";

const decryptCollections = getDecryptCollectionsFunction();

export default function CollectionsMain() {
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const history = useHistory();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase);

  React.useEffect(() => {
    if (collections) {
      decryptCollections(collections)
        .then((entries) => setCachedCollections(entries));
      // FIXME: handle failure to decrypt collections
    }
  }, [collections]);

  if (!cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  async function onSave(collection: Etebase.Collection): Promise<void> {
    const colMgr = getCollectionManager(etebase);
    await colMgr.upload(collection);

    history.push(routeResolver.getRoute("collections"));
  }

  async function onDelete(collection: Etebase.Collection) {
    const colMgr = getCollectionManager(etebase);
    await collection.delete();
    await colMgr.upload(collection);

    history.push(routeResolver.getRoute("collections"));
  }

  function onCancel() {
    history.goBack();
  }

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("collections")}
        exact
      >
        <CollectionList collections={cachedCollections} />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("collections.new")
          )}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections.import")}
        exact
      >
        Import
      </Route>
      <Route
        path={routeResolver.getRoute("collections.new")}
        exact
      >
        <CollectionEdit
          onSave={onSave}
          onDelete={onDelete}
          onCancel={onCancel}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections._id")}
        render={({ match }) => {
          const colUid = match.params.colUid;
          const collection = cachedCollections.find((x) => x.collection.uid === colUid);
          if (!collection) {
            return (<PageNotFound />);
          }

          return (
            <Switch>
              <Route
                path={routeResolver.getRoute("collections._id.edit")}
                exact
              >
                <CollectionEdit
                  collection={collection}
                  onSave={onSave}
                  onDelete={onDelete}
                  onCancel={onCancel}
                />
              </Route>
              <Route
                path={routeResolver.getRoute("collections._id.members")}
                exact
              >
                Members
              </Route>
              <Route
                path={routeResolver.getRoute("collections._id")}
                exact
              >
                <Collection collection={collection} />
              </Route>
            </Switch>
          );
        }}
      />
    </Switch>
  );
}
