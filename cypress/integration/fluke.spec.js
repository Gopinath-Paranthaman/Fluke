import * as tests from '../fixtures/fluke.scenarios.json'
describe('Fluke-Netwrok Prototype Application Testing', () => {

    let tab = {}
    beforeEach(() => {
        const dataFiles = ['roles', 'userRoles', 'projects', 'organizations']
        tab = {
            USERS: {
                id: 0,
                name: "USERS",
                selectMessage: 'Find users by selecting role',
                tableHeaders: ['FULL NAME', 'CREATED AT', 'ID', 'USER ID', 'ROLE ID']
            },
            PROJECTS: {
                id: 1,
                name: "PROJECTS",
                selectMessage: 'Find projects by selecting organizations',
                tableHeaders: ['ID', 'ORGANIZATION ID', 'USER ID', 'PROJECT NAME', 'CREATED AT']
            }
        }
        let data = {};
        cy.visit('')
        dataFiles.forEach(dataFile => {
            cy.request(`http://hiring.lwl.com.s3-website-us-east-1.amazonaws.com/assets/${dataFile}.csv`).then(dataCsv => {
                data[dataFile] = (csvToJSON(dataCsv.body ? dataCsv.body : dataCsv.Response.body))
            })
        })
        cy.wrap(data).as('data')
    })

    tests.Tests.forEach(test => {
        // if (test.Tab === 'USERS')
        it('Users Table Validation', () => {
            cy.get('img').should('have.attr', 'src', 'assets/flukeLogo.png')
            cy.get('.headInfo').validateText('FLUKE NETWORKS')
            validateTab(test)
            cy.get('.copyright')
                .validateText('Copyright Â© 2021 Fluke Corporation. All Rights Reserved.')
        })
    })

    const validateTab = function (test) {
        cy.get(`#mat-tab-label-0-${tab[test.Tab].id}`).validateText(tab[test.Tab].name)
        cy.get(`#mat-tab-label-0-${tab[test.Tab].id}`).then($element => {
            if ($element.attr('aria-selected') !== true)
                $element.click()
        })
        cy.get(`#mat-tab-content-0-${tab[test.Tab].id}`).within(() => {
            cy.get('.tabInfo').validateText(tab[test.Tab].selectMessage)
            cy.get(`#mat-select-${tab[test.Tab].id} .mat-select-value`).should('have.text', '\xa0')
            cy.get(`.mat-select-arrow-wrapper:eq(0)`).click({ force: true })
        });
        cy.get('@data').then(data => {
            // cy.writeFile('cypress/fixtures/data.json', data)

            cy.get(`#mat-select-${tab[test.Tab].id}-panel mat-option`).each(($option, optionIndex) => {
                if (test.Tab === 'USERS')
                    expect($option.text().trim()).to.eq(data.roles[optionIndex].name.trim())
                if (test.Tab === 'PROJECTS')
                    expect($option.text().trim()).to.eq(data.organizations[optionIndex].name.trim())
            })
            cy.get(`#mat-select-${tab[test.Tab].id}-panel mat-option:contains(${test.DropdownSelection})`, { timeout: 10000 })
                .click({ force: true })
            if (test.Tab === 'USERS')
                cy.get(`#mat-tab-content-0-${tab[test.Tab].id} mat-table`).within(() => {
                    cy.get('mat-header-row mat-header-cell').each(($header, headerIndex) => {
                        expect($header.text().trim()).to.eq(tab[test.Tab].tableHeaders[headerIndex])
                    })
                    const selectedUsers = data.userRoles.filter(x => x.role_id == data.roles.find(y => y.name.trim() == test.DropdownSelection.trim()).id)
                    cy.get('mat-row').each(($row, rowIndex) => {
                        let selectedUser = selectedUsers[rowIndex]
                        expect($row.find('mat-cell').eq(0).text().replace(/\r/g, '').trim())
                            .to.eq(`${selectedUser.fname} ${selectedUser.lname}`)
                        expect($row.find('mat-cell').eq(1).text().trim())
                            .to.eq(selectedUser.created_at)
                        expect($row.find('mat-cell').eq(2).text().trim())
                            .to.eq(selectedUser.id)
                        expect($row.find('mat-cell').eq(3).text().trim())
                            .to.eq(selectedUser.user_id)
                        expect($row.find('mat-cell').eq(4).text().trim())
                            .to.eq(selectedUser.role_id)
                    })
                })
            if (test.Tab === 'PROJECTS')
                cy.get(`#mat-tab-content-0-${tab[test.Tab].id} mat-table`).within(() => {
                    cy.get('mat-header-row mat-header-cell').each(($header, headerIndex) => {
                        expect($header.text().trim()).to.eq(tab[test.Tab].tableHeaders[headerIndex])
                    })
                    const selectedProjects = data.projects.filter(x => x.organization_id == data.organizations.find(y => y.name.trim() == test.DropdownSelection.trim()).organization_id)
                    cy.get('mat-row').each(($row, rowIndex) => {
                        let selectedProject = selectedProjects[rowIndex]
                        expect($row.find('mat-cell').eq(0).text().trim())
                            .to.eq(selectedProject.id)
                        expect($row.find('mat-cell').eq(1).text().trim())
                            .to.eq(selectedProject.organization_id)
                        expect($row.find('mat-cell').eq(2).text().trim())
                            .to.eq(selectedProject.user_id)
                        expect($row.find('mat-cell').eq(3).text().trim())
                            .to.eq(selectedProject.name)
                        expect($row.find('mat-cell').eq(4).text().trim())
                            .to.eq(selectedProject.created_at)
                    })
                })

        });
    }

    const csvToJSON = function (csv) {
        const lines = csv.replace(/\"/g, '').replace(/\r/g, '').split('\n')
        const result = []
        const headers = lines[0].split(',')

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i])
                continue
            const obj = {}
            const currentline = lines[i].split(',')

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j]
            }
            result.push(obj)
        }
        return result
    }
})
