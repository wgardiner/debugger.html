/* eslint max-nested-callbacks: ["error", 4] */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { toPairs } from "lodash";

import type { NamedValue } from "./types";
import type { BindingContents, ScopeBindings } from "debugger-html";

// VarAndBindingsPair actually is [name: string, contents: BindingContents]
type VarAndBindingsPair = Array<any>;
type VarAndBindingsPairs = Array<VarAndBindingsPair>;

// Scope's bindings field which holds variables and arguments
type ScopeBindingsWrapper = {
  variables: ScopeBindings,
  arguments: BindingContents[]
};

export function getSourceBindingVariables(
  bindings: ScopeBindingsWrapper,
  sourceBindings: {
    [originalName: string]: string
  },
  parentName: string
): NamedValue[] {
  const result = getBindingVariables(bindings, parentName);
  const index: any = Object.create(null);
  result.forEach(entry => {
    index[entry.name] = { used: false, entry };
  });
  // Find and replace variables that is present in sourceBindings.
  const bound = Object.keys(sourceBindings).map(name => {
    const generatedName = sourceBindings[name];
    const foundMap = index[generatedName];
    let contents;
    if (foundMap) {
      foundMap.used = true;
      contents = foundMap.entry.contents;
    } else {
      contents = { value: { type: "undefined" } };
    }
    return {
      name,
      generatedName,
      path: `${parentName}/${generatedName}`,
      contents
    };
  });
  // Use rest of them (not found in the sourceBindings) as is.
  const unused = result.filter(entry => !index[entry.name].used);
  return bound.concat(unused);
}

// Create the tree nodes representing all the variables and arguments
// for the bindings from a scope.
export function getBindingVariables(
  bindings: ScopeBindingsWrapper,
  parentName: string
): NamedValue[] {
  const args: VarAndBindingsPairs = bindings.arguments.map(
    arg => toPairs(arg)[0]
  );
  const variables: VarAndBindingsPairs = toPairs(bindings.variables);

  return args.concat(variables).map(binding => {
    const name = (binding[0]: string);
    const contents = (binding[1]: BindingContents);
    return {
      name,
      path: `${parentName}/${name}`,
      contents
    };
  });
}