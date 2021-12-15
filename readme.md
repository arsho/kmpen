# Kaplan Meier Graph

KMPen is a visualization tool to create Kaplan Meier survival graph.

### Features
- Create Kaplan-Meier survival graph based on dataset mentioned in paper [Understanding survival analysis: Kaplan-Meier estimate](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3059453/).
- The project can create random dataset and generate Kaplan-Meier survival graph based on the dataset.
- Responsive design.

### Demo

- Graph with data
  ![Full Page](Screenshots/full.png)
- Data
  ![data](Screenshots/data.png)
- Kaplan Meier Survival Graph
  ![Full Page](Screenshots/km_graph.png)

### Tools
- Bootstrap 5
- Datatable
- jQuery
- ChartJS

## Support

Please [open an issue](https://github.com/arsho/kmpen/issues/new) for support.

## Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/arsho/kids_math/compare/).

### Git methods
- Create new branch:
    ```
    git fetch origin
    git checkout master
    git reset --hard origin/master
    git checkout -b BRANCH_NAME
    ```    
- To check local changes:
    ```
    git status -s
    ```
- Commit changes:
    ```
    git add --all
    git commit -m "Issue:Issue_Number message"
    git push origin BRANCH_NAME
    ```    
- To fetch from upstream repository:
    ```
    git fetch origin
    ```
- To reset local files to upstream repository `main` branch after fetching the changes:
    ```
    git reset --hard origin/main
    ```

### Resources
- [Understanding survival analysis: Kaplan-Meier estimate](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3059453/)
- [A PRACTICAL GUIDE TO UNDERSTANDING KAPLAN-MEIER CURVES](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3932959/)
- [Chartjs line chart documentation](https://www.chartjs.org/docs/latest/charts/line.html)
- [Kaplan Meier graph example](https://canvasxpress.org/examples/kaplan-meier-1.html)