# Columns Layout Paradigm Feature

### Overview
Implemented a new layout paradigm option that allows users to organize frames in a **columns-based layout** instead of the traditional rows-based approach. This feature is particularly beneficial for presentation designs and wide-format layouts where vertical organization is more space-efficient and visually appealing.

---

### User Request
> "Love Super Tidy, but wondering if you could have a toggle to do the same thing, but with a Columns paradigm, instead of just Rows. I and a lot of my colleagues use Figma to build presentations, which have a wide format. Dividing sections up in columns saves space, and feels nicer to me sometimes. Thanks for your time!"

---

### Feature Implementation

#### **User Experience**
- **New Preference**: "Layout paradigm" selector in Preferences tab
- **Two Options**:
  - **Rows** (default): Traditional horizontal flow, good for mobile designs
  - **Columns**: Vertical flow, ideal for presentations and wide formats
- **Universal Support**: All Super Tidy actions respect the selected paradigm:
  - Tidy (repositioning)
  - Rename (numbering)
  - Reorder (layer organization)
  - Pager (text variable replacement)

#### **Layout Behavior Comparison**

**Rows Layout (Original):**
```
Frame1  Frame2  Frame3
Frame4  Frame5  Frame6
```
- Organizes left-to-right, then top-to-bottom
- Numbers: 1, 2, 3, 4, 5, 6
- Best for: Mobile designs, narrow layouts

**Columns Layout (New):**
```
Frame1  Frame4
Frame2  Frame5  
Frame3  Frame6
```
- Organizes top-to-bottom, then left-to-right
- Numbers: 1, 2, 3, 4, 5, 6 (same sequence, different spatial arrangement)
- Best for: Presentations, wide layouts, dashboard designs

---

### Technical Architecture

#### **Code Refactoring**
- **Extracted layout algorithms** from `Core.js` into `src/utils/LayoutUtils.js`
- **Modularized functions** for better maintainability and testing
- **Reduced Core.js complexity** as requested by user

#### **New Utility Functions (`src/utils/LayoutUtils.js`)**

**Core Functions:**
- `getNodesGroupedbyPosition(nodes, layout)` - Groups nodes by rows or columns
- `repositionNodes(groupedNodes, ...)` - Handles both layout paradigms
- `reorderNodes(groupedNodes, layout, ...)` - Reorders based on paradigm
- `applyPagerNumbers(groupedNodes, layout, ...)` - Numbers frames correctly
- `applyRenameStrategy(groupedNodes, layout, ...)` - Renames with proper sequencing

**Algorithm Differences:**
- **Rows**: Sort by X → group by Y → process left-to-right, top-to-bottom
- **Columns**: Sort by Y → group by X → process top-to-bottom, left-to-right

#### **Preference Integration**
- **Storage**: Added `layout_paradigm` to preferences object
- **Default**: 'rows' for backward compatibility
- **UI**: Select dropdown with clear descriptions
- **Persistence**: Saved with other user preferences

#### **Core.js Updates**
- **Import**: Layout utility functions
- **Parameters**: All command functions accept `layoutParadigm` parameter
- **Defaults**: Fallback to 'rows' if preference not set
- **Integration**: Both menu commands and UI actions use paradigm setting

#### **UI Integration**
- **PreferencesView.js**: Added layout paradigm selector
- **App.js**: Pass layout paradigm attribute to preferences view
- **Data Flow**: Core.js → App.js → PreferencesView.js → back to Core.js

---

### Implementation Details

#### **Files Modified**
1. **`src/utils/LayoutUtils.js`** (NEW)
   - Pure layout algorithm functions
   - Support for both rows and columns paradigms
   - Modular, testable code structure

2. **`src/Core.js`**
   - Import layout utilities
   - Remove old algorithm code (cleaner codebase)
   - Add layout paradigm parameters to all commands
   - Update default preferences

3. **`src/ui/views/preferences/PreferencesView.js`**
   - Add layout paradigm selector UI
   - Update savePreferences() to capture new setting
   - Clear user-facing descriptions

4. **`src/App.js`**
   - Pass layoutparadigm attribute to preferences view
   - Ensure proper data binding

#### **Backward Compatibility**
- **Default behavior**: Unchanged for existing users
- **Preference migration**: Automatic fallback to 'rows'
- **No breaking changes**: All existing functionality preserved

#### **Performance Considerations**
- **Pure functions**: All layout algorithms are stateless
- **Efficient sorting**: Optimized for typical Figma selection sizes
- **Memory usage**: No additional overhead for rows layout

---

### Benefits & Use Cases

#### **For Presentation Designers**
- **Wide layouts**: Better organization for 16:9 and wider formats
- **Space efficiency**: Vertical stacking saves horizontal real estate
- **Visual flow**: More natural reading pattern for presentation content

#### **For Dashboard Designers**
- **Card layouts**: Column organization for dashboard components
- **Responsive thinking**: Easier to visualize mobile-first approaches
- **Content grouping**: Logical vertical groupings

#### **For All Users**
- **Choice**: Flexibility to pick the best paradigm per project
- **Consistency**: Same numbering logic, different spatial arrangement
- **Familiarity**: Easy toggle, no learning curve

---

### Quality Assurance

#### **Testing Scenarios**
- ✅ Rows layout maintains original behavior
- ✅ Columns layout works with all commands (Tidy, Rename, Reorder, Pager)
- ✅ Preference saving and loading
- ✅ Default fallback for new/migrated users
- ✅ Build process successful
- ✅ No linting errors

#### **Edge Cases Handled**
- ✅ Missing layout_paradigm preference (defaults to 'rows')
- ✅ Invalid preference values (fallback behavior)
- ✅ Single frame selections
- ✅ Complex nested groupings

#### **Code Quality**
- ✅ Pure functions for testability
- ✅ Clear separation of concerns
- ✅ Consistent naming conventions
- ✅ Proper error handling

---

### Future Enhancements (Optional)

#### **Potential Improvements**
- [ ] **Grid layout**: Fixed grid with user-defined columns/rows
- [ ] **Custom spacing**: Different X/Y spacing for columns vs rows
- [ ] **Visual preview**: Show layout paradigm preview in preferences
- [ ] **Smart detection**: Auto-suggest paradigm based on selection aspect ratio
- [ ] **Mixed layouts**: Hybrid approaches for complex designs

#### **Advanced Features**
- [ ] **Layout templates**: Saved layout configurations
- [ ] **Responsive breakpoints**: Different paradigms for different screen sizes
- [ ] **Animation**: Smooth transitions between paradigms
- [ ] **Batch operations**: Apply different paradigms to different selections

---

### Technical Notes

#### **Architecture Decisions**
- **Pure functions**: Easier to test and reason about
- **Parameter passing**: Explicit layout paradigm parameter vs global state
- **Fallback strategy**: Conservative defaults for reliability
- **Code organization**: Separate utility file for better maintainability

#### **Memory Considerations**
- Follows project architecture principles:
  - Core.js handles pure Figma Canvas and Storage APIs
  - UI logic remains in appropriate components
  - No cross-contamination of concerns

#### **Performance Impact**
- **Minimal overhead**: Sorting algorithms are O(n log n)
- **Memory efficient**: No additional data structures for rows mode
- **Cache friendly**: Preference stored once, used multiple times

---

### Status: ✅ **Production Ready**

The columns layout paradigm feature is fully implemented and ready for production use. It addresses the user's specific request while maintaining backward compatibility and improving overall code organization. The feature provides significant value for presentation designers and wide-format layouts while preserving the familiar experience for existing users.

#### **Deployment Checklist**
- [x] Feature implementation complete
- [x] Code refactoring successful
- [x] Build process verified
- [x] No linting errors
- [x] Backward compatibility maintained
- [x] User interface updated
- [x] Preference integration working

The feature enhances Super Tidy's versatility and directly addresses the presentation design workflow pain point identified by the user community.
